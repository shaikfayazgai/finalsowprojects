/**
 * Matching v1 types.
 *
 * The Phase 1 matching engine takes a TaskDefinition (with its
 * `requiredSkills` codes) and returns ranked contributor candidates.
 *
 * Score components (deterministic, additive):
 *   - Skill match: weighted by level + source. Required skills add
 *     more than nice-to-have.
 *   - Coverage ratio: bonus for matching MORE of the required skills.
 *   - Source trust: verified > assessment > self.
 *   - Penalty: each unmatched required skill -10.
 *   - Optional fallback: category-level matches (lower weight).
 *
 * Phase 2 adds: review history, mentor-trust score, capacity check,
 * recency-decay on skill claims, NDA / KYC gating.
 */

export type MatchReasonCode =
  | "exact_skill_match"
  | "verified_expertise"
  | "assessment_score"
  | "all_required_covered"
  | "category_fallback"
  | "partial_coverage";

export interface MatchReason {
  code: MatchReasonCode;
  label: string;
  /** Skills that drove this reason (codes). Empty for global reasons. */
  skillCodes?: string[];
  /** Numeric contribution to the candidate score. */
  scoreDelta: number;
}

export interface MatchedSkill {
  skillId: string;
  code: string;
  name: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  source: "self" | "assessment" | "verified";
  proficiencyScore: number | null;
  /** True if the matched skill is in the task's requiredSkills set. */
  isRequired: boolean;
}

export interface MatchCandidate {
  userId: string;
  displayName: string;
  email: string;

  /** Aggregated score. Range typically 0–200; higher is better. */
  score: number;

  /** Skills that contributed positively to the score. */
  skillMatches: MatchedSkill[];

  /** Required skill codes that the candidate does NOT hold. */
  missingRequiredSkills: string[];

  /** Coverage = matched required / total required. 0–1. */
  coverage: number;

  /** Human-readable explanations sorted by scoreDelta desc. */
  reasons: MatchReason[];
}

export interface FindCandidatesOptions {
  taskId: string;
  /** Cap on returned candidates. Default 20. */
  limit?: number;
  /** Minimum score to include. Default 0. */
  minScore?: number;
  /** When true, expand category siblings if exact matches < limit. */
  enableCategoryFallback?: boolean;
  /** Pool scope: organization (tenant internal), network (marketplace), organization_first. */
  pool?: "organization" | "network" | "organization_first";
}

export interface FindCandidatesResult {
  taskId: string;
  taskTitle: string;
  requiredSkills: string[];
  totalCandidatesConsidered: number;
  candidates: MatchCandidate[];
}
