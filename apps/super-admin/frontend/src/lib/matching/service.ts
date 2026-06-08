/**
 * Matching v1 — skill-based candidate ranking.
 *
 * Algorithm:
 *   1. Load task + required skill codes.
 *   2. Find users with at least one ContributorSkill matching any
 *      required code. (Cross-tenant: contributors are global.)
 *   3. For each candidate:
 *        a. Compute level/source-weighted score per matched skill.
 *        b. Apply coverage bonus (matched required / total required).
 *        c. Apply missing-required penalty (-10 each).
 *        d. Synthesize reasons sorted by scoreDelta.
 *   4. If exact matches < limit AND category fallback enabled,
 *      expand to users with the same parent-category skills at
 *      reduced weight, but never score above any exact-match candidate.
 *   5. Sort by score desc, slice to `limit`, return.
 *
 * Notes:
 *   - Required skills missing on the candidate emit a `partial_coverage`
 *     reason, not a separate row per missing skill, to keep the UI
 *     concise.
 *   - The `enableCategoryFallback` switch is off by default; it can
 *     surface lower-quality matches when exact pool is thin.
 *   - The task's tenantId is bound via RLS on the calling tx; we read
 *     TaskDefinition through that scope. Contributors are NOT
 *     RLS-scoped (no tenantId column), so the candidate pool is global.
 */

import { Prisma } from "@/generated/prisma/client";
import type {
  FindCandidatesOptions,
  FindCandidatesResult,
  MatchCandidate,
  MatchReason,
  MatchedSkill,
} from "./types";
import { contributorMatchesPool } from "@/lib/workforce/policies";

type Tx = Prisma.TransactionClient;

export class MatchingServiceError extends Error {
  constructor(
    message: string,
    public code: "not_found" | "validation" | "invalid_state",
  ) {
    super(message);
    this.name = "MatchingServiceError";
  }
}

/* ──────────────────────── Score weights ──────────────────────── */

const LEVEL_WEIGHT: Record<MatchedSkill["level"], number> = {
  beginner: 8,
  intermediate: 16,
  advanced: 28,
  expert: 36,
};

const SOURCE_BONUS: Record<MatchedSkill["source"], number> = {
  self: 0,
  assessment: 6,
  verified: 14,
};

/** Bonus multiplier when the matched skill is in the required list. */
const REQUIRED_MULT = 1.4;

/** Penalty per missing required skill. */
const MISSING_PENALTY = 10;

/** Coverage bonus = coverage * COVERAGE_BONUS. */
const COVERAGE_BONUS = 25;

/** Category fallback weight (applied to non-exact category-sibling matches). */
const CATEGORY_FALLBACK_MULT = 0.4;

/* ──────────────────────── Internal types ──────────────────────── */

interface SkillRow {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  category: string | null;
}

interface ContribClaim {
  userId: string;
  skillId: string;
  level: string;
  source: string;
  proficiencyScore: number | null;
}

interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string | null;
  contribType: string | null;
}

/* ──────────────────────── Main entry point ──────────────────────── */

export async function findCandidatesForTask(
  tx: Tx,
  options: FindCandidatesOptions,
): Promise<FindCandidatesResult> {
  const limit = options.limit ?? 20;
  const minScore = options.minScore ?? 0;
  const enableFallback = options.enableCategoryFallback ?? false;

  // 1. Load task
  const task = await tx.taskDefinition.findFirst({
    where: { id: options.taskId },
    select: { id: true, title: true, requiredSkills: true, status: true, tenantId: true },
  });
  if (!task) {
    throw new MatchingServiceError("Task not found in tenant scope", "not_found");
  }
  const requiredCodes = task.requiredSkills ?? [];
  if (requiredCodes.length === 0) {
    return {
      taskId: task.id,
      taskTitle: task.title,
      requiredSkills: [],
      totalCandidatesConsidered: 0,
      candidates: [],
    };
  }

  // 2. Resolve required skills + (optionally) category siblings
  const requiredSkills = await tx.skill.findMany({
    where: { code: { in: requiredCodes }, deletedAt: null },
    select: { id: true, code: true, name: true, parentId: true, category: true },
  });
  const requiredIds = new Set(requiredSkills.map((s) => s.id));
  const requiredById = new Map(requiredSkills.map((s) => [s.id, s]));

  // Category siblings: any skill that shares a parentId with a required skill
  let siblingIds = new Set<string>();
  let siblingById = new Map<string, SkillRow>();
  if (enableFallback) {
    const parentIds = requiredSkills
      .map((s) => s.parentId)
      .filter((p): p is string => p !== null);
    if (parentIds.length > 0) {
      const siblings = await tx.skill.findMany({
        where: {
          deletedAt: null,
          active: true,
          parentId: { in: parentIds },
          id: { notIn: Array.from(requiredIds) },
        },
        select: { id: true, code: true, name: true, parentId: true, category: true },
      });
      siblingIds = new Set(siblings.map((s) => s.id));
      siblingById = new Map(siblings.map((s) => [s.id, s]));
    }
  }
  const consideredSkillIds = Array.from(
    new Set([...requiredIds, ...siblingIds]),
  );

  if (consideredSkillIds.length === 0) {
    return {
      taskId: task.id,
      taskTitle: task.title,
      requiredSkills: requiredCodes,
      totalCandidatesConsidered: 0,
      candidates: [],
    };
  }

  // 3. Load all claims for these skills (cross-tenant)
  const claims: ContribClaim[] = await tx.contributorSkill.findMany({
    where: { skillId: { in: consideredSkillIds } },
    select: {
      userId: true,
      skillId: true,
      level: true,
      source: true,
      proficiencyScore: true,
    },
  });
  if (claims.length === 0) {
    return {
      taskId: task.id,
      taskTitle: task.title,
      requiredSkills: requiredCodes,
      totalCandidatesConsidered: 0,
      candidates: [],
    };
  }

  // Group claims by user
  const claimsByUser = new Map<string, ContribClaim[]>();
  for (const c of claims) {
    if (!claimsByUser.has(c.userId)) claimsByUser.set(c.userId, []);
    claimsByUser.get(c.userId)!.push(c);
  }

  const pool = options.pool ?? "network";

  // 4. Load user metadata
  const userRows = await tx.user.findMany({
    where: {
      id: { in: Array.from(claimsByUser.keys()) },
      role: "contributor",
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      tenantId: true,
      contributorProfile: { select: { contribType: true } },
    },
  });
  const userById = new Map<string, UserRow>(
    userRows.map((u) => [
      u.id,
      {
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        tenantId: u.tenantId,
        contribType: u.contributorProfile?.contribType ?? null,
      },
    ]),
  );

  // 5. Score each user
  const skillById = new Map<string, SkillRow>([
    ...requiredById,
    ...siblingById,
  ]);
  const candidates: MatchCandidate[] = [];

  for (const [userId, userClaims] of claimsByUser) {
    const user = userById.get(userId);
    if (!user) continue; // skipped: not a contributor

    if (pool === "organization") {
      if (
        !contributorMatchesPool({
          pool: "organization",
          taskTenantId: task.tenantId,
          userTenantId: user.tenantId,
          contribType: user.contribType,
        })
      ) {
        continue;
      }
    } else if (pool === "network") {
      if (
        !contributorMatchesPool({
          pool: "network",
          taskTenantId: task.tenantId,
          userTenantId: user.tenantId,
          contribType: user.contribType,
        })
      ) {
        continue;
      }
    }
    // organization_first: no pool filter — sorted below

    let score = 0;
    const skillMatches: MatchedSkill[] = [];
    const matchedRequiredIds = new Set<string>();
    let categoryFallbackUsed = false;
    let verifiedCount = 0;
    let assessmentCount = 0;

    for (const c of userClaims) {
      const skill = skillById.get(c.skillId);
      if (!skill) continue;

      const level = c.level as MatchedSkill["level"];
      const source = c.source as MatchedSkill["source"];
      const levelWeight = LEVEL_WEIGHT[level] ?? 12;
      const sourceBonus = SOURCE_BONUS[source] ?? 0;
      const isRequired = requiredIds.has(c.skillId);

      let contribution = levelWeight + sourceBonus;
      if (isRequired) {
        contribution *= REQUIRED_MULT;
        matchedRequiredIds.add(c.skillId);
      } else {
        contribution *= CATEGORY_FALLBACK_MULT;
        categoryFallbackUsed = true;
      }
      score += contribution;

      if (source === "verified") verifiedCount++;
      if (source === "assessment") assessmentCount++;

      skillMatches.push({
        skillId: skill.id,
        code: skill.code,
        name: skill.name,
        level,
        source,
        proficiencyScore: c.proficiencyScore,
        isRequired,
      });
    }

    const coverage = matchedRequiredIds.size / requiredCodes.length;
    score += coverage * COVERAGE_BONUS;

    const missingRequiredSkills = requiredSkills
      .filter((s) => !matchedRequiredIds.has(s.id))
      .map((s) => s.code);
    // Only penalize missing required skills when the candidate has at
    // least one exact required match. Pure category-fallback candidates
    // are already weighted down (CATEGORY_FALLBACK_MULT) and surface a
    // distinct reason; double-penalizing them with the missing-penalty
    // pushes their score negative and filters them out even when the
    // operator opted in via enableCategoryFallback.
    if (matchedRequiredIds.size > 0) {
      score -= missingRequiredSkills.length * MISSING_PENALTY;
    }

    // Skip candidates whose entire contribution was through category
    // fallback (no exact skill match) when fallback is disabled.
    if (!enableFallback && matchedRequiredIds.size === 0) continue;

    if (score < minScore) continue;

    // Reasons (sorted by scoreDelta below)
    const reasons: MatchReason[] = [];
    if (matchedRequiredIds.size > 0) {
      const codes = Array.from(matchedRequiredIds)
        .map((id) => skillById.get(id)?.code)
        .filter((c): c is string => !!c);
      reasons.push({
        code: "exact_skill_match",
        label:
          codes.length === 1
            ? `Holds the required skill: ${codes[0]}`
            : `Holds ${codes.length} of ${requiredCodes.length} required skills`,
        skillCodes: codes,
        scoreDelta: Math.round(
          codes.length * (LEVEL_WEIGHT.intermediate * REQUIRED_MULT),
        ),
      });
    }
    if (coverage === 1) {
      reasons.push({
        code: "all_required_covered",
        label: "Covers every required skill",
        scoreDelta: Math.round(COVERAGE_BONUS),
      });
    } else if (coverage > 0 && coverage < 1) {
      reasons.push({
        code: "partial_coverage",
        label: `Covers ${matchedRequiredIds.size}/${requiredCodes.length} required skills`,
        scoreDelta: Math.round(coverage * COVERAGE_BONUS),
      });
    }
    if (verifiedCount > 0) {
      reasons.push({
        code: "verified_expertise",
        label:
          verifiedCount === 1
            ? "Has a verified skill claim"
            : `Has ${verifiedCount} verified skill claims`,
        scoreDelta: Math.round(verifiedCount * SOURCE_BONUS.verified),
      });
    }
    if (assessmentCount > 0) {
      reasons.push({
        code: "assessment_score",
        label:
          assessmentCount === 1
            ? "Has an assessment-backed skill claim"
            : `Has ${assessmentCount} assessment-backed claims`,
        scoreDelta: Math.round(assessmentCount * SOURCE_BONUS.assessment),
      });
    }
    if (categoryFallbackUsed && enableFallback) {
      reasons.push({
        code: "category_fallback",
        label: "Adjacent expertise through category siblings",
        scoreDelta: 0,
      });
    }
    reasons.sort((a, b) => b.scoreDelta - a.scoreDelta);

    // Sort skill matches: required first, then by level
    const levelOrder: Record<MatchedSkill["level"], number> = {
      expert: 0,
      advanced: 1,
      intermediate: 2,
      beginner: 3,
    };
    skillMatches.sort((a, b) => {
      if (a.isRequired !== b.isRequired) return a.isRequired ? -1 : 1;
      return levelOrder[a.level] - levelOrder[b.level];
    });

    candidates.push({
      userId: user.id,
      displayName: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      score: Math.round(score * 10) / 10,
      skillMatches,
      missingRequiredSkills,
      coverage: Math.round(coverage * 100) / 100,
      reasons,
    });
  }

  // 6. Sort + slice
  if (pool === "organization_first") {
    candidates.sort((a, b) => {
      const aUser = userById.get(a.userId);
      const bUser = userById.get(b.userId);
      const aOrg = aUser
        ? contributorMatchesPool({
            pool: "organization",
            taskTenantId: task.tenantId,
            userTenantId: aUser.tenantId,
            contribType: aUser.contribType,
          })
          ? 1
          : 0
        : 0;
      const bOrg = bUser
        ? contributorMatchesPool({
            pool: "organization",
            taskTenantId: task.tenantId,
            userTenantId: bUser.tenantId,
            contribType: bUser.contribType,
          })
          ? 1
          : 0
        : 0;
      if (aOrg !== bOrg) return bOrg - aOrg;
      return b.score - a.score;
    });
  } else {
    candidates.sort((a, b) => b.score - a.score);
  }
  const sliced = candidates.slice(0, limit);

  return {
    taskId: task.id,
    taskTitle: task.title,
    requiredSkills: requiredCodes,
    totalCandidatesConsidered: candidates.length,
    candidates: sliced,
  };
}
