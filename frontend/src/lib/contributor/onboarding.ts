/**
 * Contributor onboarding service.
 *
 * Pulls together the cross-tenant pieces that the V2 onboarding UI
 * captures and persists them into the Phase 1 schema:
 *
 *   1. User row (upsert by userId)
 *   2. ContributorProfile (the long-form per-contributor metadata)
 *   3. ContributorSkill rows — best-effort matched against the M10
 *      Skill taxonomy. Unmatched free-text skills stay in the
 *      ContributorProfile.primarySkills array for legacy display +
 *      future re-matching.
 *   4. Audit event "contributor.onboarding.complete" with a payload
 *      summarising what was written.
 *
 * Idempotency: running this twice for the same userId produces the
 * same end state. The ContributorProfile upserts; ContributorSkill
 * rows are reconciled (added/removed) to match the inputs each run.
 *
 * Cross-tenant: contributors don't carry a tenantId. Audit events
 * are emitted with tenantId=null (platform scope) since the
 * onboarding event isn't owned by any single enterprise tenant.
 */

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { auditEmit } from "@/lib/audit";
import type { AuditActor } from "@/lib/audit";
import { buildAdminKycCaseFromOnboarding } from "@/lib/admin/kyc-onboarding-case";
import { submitKycCheck } from "@/lib/kyc/service";
import type { MockKycCase } from "@/mocks/admin/kyc";
import type { ContribType } from "@/lib/contributor/track";
import { contribTypeRequiresKycReview } from "@/lib/contributor/track";

type Tx = Prisma.TransactionClient;

export interface OnboardingInput {
  /** The signed-in user id, derived from the session — never client-supplied. */
  userId: string;
  email: string;

  // Identity (Step 1)
  firstName: string;
  lastName?: string;
  contribType: "internal" | "student" | "women_workforce" | "general_workforce" | "";
  country: string;

  // Profile (Step 2)
  dob: string; // ISO date
  timezone: string;
  departmentCategory: string;
  departmentOther?: string;
  availability: string;
  degree?: string;
  branch?: string;
  linkedin?: string;
  careerStage?: string;
  yearsExperience?: string;
  workStart?: string;
  workEnd?: string;

  /** Free-text skill arrays from the UI. We sync these to ContributorSkill
   *  where possible (taxonomy match) and keep originals on the profile. */
  primarySkills: string[];
  secondarySkills: string[];
  otherSkills: string[];

  // Verification (Step 3)
  phone?: string;
  ndaAccepted: boolean;
  ndaSignature?: string;

  // Consent (Step 4)
  acceptTos: boolean;
  acceptCoc: boolean;
  acceptPrivacy: boolean;
  acceptFee: boolean;
  acceptAhp: boolean;
  marketingOptIn: boolean;
}

export class OnboardingError extends Error {
  constructor(
    message: string,
    public code: "validation" | "not_found" | "consent_required",
  ) {
    super(message);
    this.name = "OnboardingError";
  }
}

export interface OnboardingResult {
  userId: string;
  skillsSynced: { matched: number; unmatched: string[] };
  profileCreated: boolean;
}

/* ───────────────────── Skill matching helpers ───────────────────── */

/**
 * Resolve free-text skill strings against the global Skill taxonomy.
 * Match priority:
 *   1. exact lowercase Skill.code match (e.g. "engineering.react")
 *   2. case-insensitive Skill.name match (e.g. "React")
 *   3. category match — only used for category roots (rare)
 *
 * Returns a Map<inputString, Skill.id> for matches and a list of
 * unmatched input strings.
 */
async function resolveSkillStrings(
  tx: Tx,
  inputs: string[],
): Promise<{ matched: Map<string, string>; unmatched: string[] }> {
  if (inputs.length === 0) {
    return { matched: new Map(), unmatched: [] };
  }
  const cleaned = inputs
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const lowered = cleaned.map((s) => s.toLowerCase());

  const skills = await tx.skill.findMany({
    where: {
      deletedAt: null,
      active: true,
      OR: [
        { code: { in: lowered } },
        // Postgres-native case-insensitive name match
        { name: { in: cleaned, mode: "insensitive" } },
      ],
    },
    select: { id: true, code: true, name: true },
  });

  const matched = new Map<string, string>();
  for (const input of cleaned) {
    const lower = input.toLowerCase();
    const byCode = skills.find((s) => s.code === lower);
    if (byCode) {
      matched.set(input, byCode.id);
      continue;
    }
    const byName = skills.find(
      (s) => s.name.toLowerCase() === lower,
    );
    if (byName) {
      matched.set(input, byName.id);
    }
  }

  const unmatched = cleaned.filter((s) => !matched.has(s));
  return { matched, unmatched };
}

/* ──────────────────────── Skill claim sync ──────────────────────── */

interface ClaimSyncPlan {
  toCreate: Array<{
    skillId: string;
    level: "advanced" | "intermediate" | "beginner";
    source: "self";
  }>;
  toUpdate: Array<{ skillId: string; level: "advanced" | "intermediate" | "beginner" }>;
  toDelete: string[]; // skillIds
  unmatched: { primary: string[]; secondary: string[]; other: string[] };
}

async function planSkillSync(
  tx: Tx,
  userId: string,
  inputs: {
    primary: string[];
    secondary: string[];
    other: string[];
  },
): Promise<ClaimSyncPlan> {
  // Resolve each tier separately so we can preserve level mapping.
  const [primary, secondary, other] = await Promise.all([
    resolveSkillStrings(tx, inputs.primary),
    resolveSkillStrings(tx, inputs.secondary),
    resolveSkillStrings(tx, inputs.other),
  ]);

  // Build the desired state map: skillId → level (highest level wins
  // if the user listed the same skill in multiple tiers).
  const LEVEL_ORDER: Record<string, number> = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
  };
  const desired = new Map<string, "advanced" | "intermediate" | "beginner">();
  const setIfHigher = (
    id: string,
    level: "advanced" | "intermediate" | "beginner",
  ) => {
    const cur = desired.get(id);
    if (!cur || LEVEL_ORDER[level] > LEVEL_ORDER[cur]) desired.set(id, level);
  };
  for (const id of primary.matched.values()) setIfHigher(id, "advanced");
  for (const id of secondary.matched.values()) setIfHigher(id, "intermediate");
  for (const id of other.matched.values()) setIfHigher(id, "beginner");

  // Load existing claims to compute diff
  const existing = await tx.contributorSkill.findMany({
    where: { userId },
    select: { skillId: true, level: true },
  });
  const existingMap = new Map(existing.map((e) => [e.skillId, e.level]));

  const toCreate: ClaimSyncPlan["toCreate"] = [];
  const toUpdate: ClaimSyncPlan["toUpdate"] = [];
  for (const [skillId, level] of desired) {
    if (!existingMap.has(skillId)) {
      toCreate.push({ skillId, level, source: "self" });
    } else if (existingMap.get(skillId) !== level) {
      toUpdate.push({ skillId, level });
    }
  }
  const toDelete: string[] = [];
  for (const [skillId] of existingMap) {
    if (!desired.has(skillId)) toDelete.push(skillId);
  }

  return {
    toCreate,
    toUpdate,
    toDelete,
    unmatched: {
      primary: primary.unmatched,
      secondary: secondary.unmatched,
      other: other.unmatched,
    },
  };
}

async function executeSkillSync(
  tx: Tx,
  userId: string,
  plan: ClaimSyncPlan,
): Promise<void> {
  if (plan.toDelete.length > 0) {
    await tx.contributorSkill.deleteMany({
      where: { userId, skillId: { in: plan.toDelete } },
    });
  }
  for (const u of plan.toUpdate) {
    await tx.contributorSkill.update({
      where: { userId_skillId: { userId, skillId: u.skillId } },
      data: { level: u.level },
    });
  }
  if (plan.toCreate.length > 0) {
    await tx.contributorSkill.createMany({
      data: plan.toCreate.map((c) => ({
        userId,
        skillId: c.skillId,
        level: c.level,
        source: c.source,
      })),
      skipDuplicates: true,
    });
  }
}

/* ───────────────────────── Main service ──────────────────────────── */

export async function completeContributorOnboarding(
  input: OnboardingInput,
  actor: AuditActor,
): Promise<OnboardingResult> {
  // Required consents — these gates are enforced server-side so the
  // client UI's checkbox state can't sneak past the contract.
  if (!input.acceptTos || !input.acceptCoc || !input.acceptPrivacy || !input.acceptAhp || !input.acceptFee) {
    throw new OnboardingError(
      "All required consents must be accepted to complete onboarding",
      "consent_required",
    );
  }
  if (!input.ndaAccepted) {
    throw new OnboardingError(
      "NDA acceptance is required",
      "consent_required",
    );
  }
  if (!input.contribType) {
    throw new OnboardingError("Contributor type is required", "validation");
  }
  if (!input.firstName.trim()) {
    throw new OnboardingError("First name is required", "validation");
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Ensure user exists (idempotent upsert by id)
    const userBefore = await tx.user.findUnique({
      where: { id: input.userId },
      select: { id: true, email: true, role: true, contributorProfile: { select: { id: true } } },
    });
    if (!userBefore) {
      throw new OnboardingError("User not found for this session", "not_found");
    }
    // Email-mismatch sanity check: the session must agree with the input.
    // Both are server-derived so a mismatch means tampering or a bug.
    if (userBefore.email.toLowerCase() !== input.email.toLowerCase()) {
      throw new OnboardingError(
        "Session email does not match onboarding input",
        "validation",
      );
    }

    // 2. Plan skill sync
    const syncPlan = await planSkillSync(tx, input.userId, {
      primary: input.primarySkills,
      secondary: input.secondarySkills,
      other: input.otherSkills,
    });

    // 3. Write user + profile in one shot
    const profileData = {
      contribType: input.contribType,
      country: input.country,
      dob: new Date(input.dob),
      timezone: input.timezone,
      departmentCategory: input.departmentCategory,
      departmentOther: input.departmentOther ?? null,
      // Store free-text arrays for legacy display + the unmatched
      // strings that didn't resolve to taxonomy entries.
      primarySkills: input.primarySkills,
      secondarySkills: input.secondarySkills,
      otherSkills: input.otherSkills,
      availability: input.availability,
      degree: input.degree ?? null,
      branch: input.branch ?? null,
      linkedin: input.linkedin ?? null,
      careerStage: input.careerStage ?? null,
      yearsExperience: input.yearsExperience ?? null,
      workStart: input.workStart ?? null,
      workEnd: input.workEnd ?? null,
      ndaAccepted: input.ndaAccepted,
      ndaSignature: input.ndaSignature ?? "",
      acceptTos: input.acceptTos,
      acceptCoc: input.acceptCoc,
      acceptPrivacy: input.acceptPrivacy,
      acceptFee: input.acceptFee,
      acceptAhp: input.acceptAhp,
      marketingOptIn: input.marketingOptIn,
    };

    await tx.user.update({
      where: { id: input.userId },
      data: {
        firstName: input.firstName,
        lastName: input.lastName ?? "",
        role: "contributor",
        phone: input.phone ?? null,
        phoneVerified: !!input.phone,
        contributorProfile: {
          upsert: { create: profileData, update: profileData },
        },
      },
    });

    // 4. Execute skill claim sync
    await executeSkillSync(tx, input.userId, syncPlan);

    // 5. Audit emit inside the same tx — atomic with the writes
    const matchedCount =
      syncPlan.toCreate.length + syncPlan.toUpdate.length;
    const unmatchedAll = [
      ...syncPlan.unmatched.primary,
      ...syncPlan.unmatched.secondary,
      ...syncPlan.unmatched.other,
    ];
    await auditEmit(
      {
        tenantId: null,
        actor,
        action: "contributor.onboarding.complete",
        resource: { type: "user", id: input.userId, label: input.email },
        payload: {
          contribType: input.contribType,
          country: input.country,
          profileCreatedNow: !userBefore.contributorProfile,
          skillsClaimed: matchedCount,
          skillsRemoved: syncPlan.toDelete.length,
          unmatchedSkillCount: unmatchedAll.length,
          ndaSignature: input.ndaSignature ? "provided" : "none",
          marketingOptIn: input.marketingOptIn,
        },
        severity: "info",
      },
      { tx },
    );

    return {
      userId: input.userId,
      skillsSynced: { matched: matchedCount, unmatched: unmatchedAll },
      profileCreated: !userBefore.contributorProfile,
    };
  });

  return result;
}

/* ───────────── Registration / lightweight onboarding helpers ───────────── */

export interface LightweightOnboardingInput {
  userId: string;
  email: string;
  firstName: string;
  lastName?: string;
  contribType: ContribType;
  track?: string;
  country?: string;
  dob?: string;
  timezone?: string;
  availability?: string;
  workStyle?: string;
  primarySkills?: string[];
  secondarySkills?: string[];
  otherSkills?: string[];
  departmentCategory?: string;
  degree?: string;
  branch?: string;
  studentId?: string;
  programme?: string;
  supervisorEmail?: string;
  supervisorName?: string;
  legalName?: string;
  idType?: string;
  idUploaded?: boolean;
  referredBy?: string;
  wantsPeerMentor?: boolean;
  acceptTos?: boolean;
  acceptCoc?: boolean;
  acceptPrivacy?: boolean;
  acceptFee?: boolean;
  acceptAhp?: boolean;
  marketingOptIn?: boolean;
  kycSubmitted?: boolean;
  kycIdType?: string;
  kycIdNumber?: string;
  payoutSkipped?: boolean;
}

/**
 * Upsert ContributorProfile after email/password registration (backend API
 * already created the remote account). Keys off email so id mismatches between
 * backend and local DB are tolerated.
 */
export async function persistLocalContributorRegistration(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  contribType: ContribType;
  country: string;
  dob: string;
  timezone: string;
  departmentCategory: string;
  departmentOther?: string;
  primarySkills: string[];
  secondarySkills: string[];
  otherSkills: string[];
  availability: string;
  degree?: string;
  branch?: string;
  linkedin?: string;
  careerStage?: string;
  yearsExperience?: string;
  workStart?: string;
  workEnd?: string;
  phone?: string;
  ndaSignature?: string;
  acceptTos: boolean;
  acceptCoc: boolean;
  acceptPrivacy: boolean;
  acceptFee: boolean;
  acceptAhp: boolean;
  marketingOptIn: boolean;
}): Promise<{ userId: string }> {
  const bcrypt = (await import("bcryptjs")).default;
  const email = input.email.toLowerCase();
  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      firstName: input.firstName,
      lastName: input.lastName,
      passwordHash,
      role: "contributor",
      phone: input.phone ?? null,
    },
    create: {
      email,
      firstName: input.firstName,
      lastName: input.lastName,
      passwordHash,
      role: "contributor",
      emailVerified: true,
      phone: input.phone ?? null,
    },
    select: { id: true },
  });

  const existingRole = await prisma.userRole.findFirst({
    where: { userId: user.id, roleCode: "contributor" },
  });
  if (!existingRole) {
    await prisma.userRole.create({
      data: { userId: user.id, roleCode: "contributor", tenantId: null },
    });
  }

  await completeContributorOnboarding(
    {
      userId: user.id,
      email,
      firstName: input.firstName,
      lastName: input.lastName,
      contribType: input.contribType,
      country: input.country,
      dob: input.dob,
      timezone: input.timezone,
      departmentCategory: input.departmentCategory,
      departmentOther: input.departmentOther,
      availability: input.availability,
      degree: input.degree,
      branch: input.branch,
      linkedin: input.linkedin,
      careerStage: input.careerStage,
      yearsExperience: input.yearsExperience,
      workStart: input.workStart,
      workEnd: input.workEnd,
      primarySkills: input.primarySkills,
      secondarySkills: input.secondarySkills,
      otherSkills: input.otherSkills,
      phone: input.phone,
      ndaAccepted: true,
      ndaSignature: input.ndaSignature,
      acceptTos: input.acceptTos,
      acceptCoc: input.acceptCoc,
      acceptPrivacy: input.acceptPrivacy,
      acceptFee: input.acceptFee,
      acceptAhp: input.acceptAhp,
      marketingOptIn: input.marketingOptIn,
    },
    {
      userId: user.id,
      portalRole: "contributor",
      sessionId: null,
      ipAddress: null,
      userAgent: null,
    },
  );

  return { userId: user.id };
}

/** Complete the unified `/onboarding/*` Meridian wizard. */
export async function finalizeLightweightOnboarding(
  input: LightweightOnboardingInput,
  actor: AuditActor,
): Promise<{ adminKycCase?: MockKycCase }> {
  const track = input.track ?? input.contribType;
  const needsKycReview = contribTypeRequiresKycReview(input.contribType);
  const identitySubmitted =
    input.contribType === "women_workforce" || track === "women_wf"
      ? !!input.idUploaded
      : !!input.kycSubmitted;

  const ndaAccepted =
    input.contribType === "internal" ||
    input.contribType === "student" ||
    track === "internal" ||
    track === "student" ||
    identitySubmitted;

  const profileData = {
    contribType: input.contribType,
    country: input.country ?? "India",
    dob: new Date(input.dob ?? "2000-01-01"),
    timezone: input.timezone ?? "Asia/Kolkata",
    departmentCategory: input.departmentCategory ?? "general",
    departmentOther: null as string | null,
    primarySkills: input.primarySkills ?? [],
    secondarySkills: input.secondarySkills ?? [],
    otherSkills: input.otherSkills ?? [],
    availability: input.availability ?? "10",
    degree: input.degree ?? input.programme ?? null,
    branch: input.branch ?? null,
    linkedin: null as string | null,
    supervisorEmail: input.supervisorEmail?.trim() || null,
    supervisorName: input.supervisorName?.trim() || null,
    supervisorApprovedAt: null as Date | null,
    careerStage: null as string | null,
    yearsExperience: null as string | null,
    workStart: null as string | null,
    workEnd: null as string | null,
    ndaAccepted,
    ndaSignature:
      input.legalName?.trim() ||
      `${input.firstName} ${input.lastName ?? ""}`.trim(),
    acceptTos: input.acceptTos ?? true,
    acceptCoc: input.acceptCoc ?? true,
    acceptPrivacy: input.acceptPrivacy ?? true,
    acceptFee: input.acceptFee ?? true,
    acceptAhp: input.acceptAhp ?? true,
    marketingOptIn: input.marketingOptIn ?? false,
  };

  await prisma.user.update({
    where: { id: input.userId },
    data: {
      firstName: input.firstName,
      lastName: input.lastName ?? "",
      contributorProfile: {
        upsert: { create: profileData, update: profileData },
      },
    },
  });

  let adminKycCase: MockKycCase | undefined;
  if (needsKycReview && identitySubmitted) {
    const idType = input.kycIdType ?? input.idType;
    const idNumber = input.kycIdNumber;

    await prisma.$transaction(async (tx) => {
      await submitKycCheck(tx, {
        contributorUserId: input.userId,
        input: {
          documents: [
            {
              kind: "id_card",
              name: idType?.trim() || "Government ID",
              url: `onboarding://${input.userId}`,
            },
          ],
        },
        actor,
      });
    });

    adminKycCase = buildAdminKycCaseFromOnboarding({
      userId: input.userId,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      contribType: input.contribType,
      country: input.country,
      dob: input.dob,
      idType,
      idNumber,
    });
  }

  await auditEmit(
    {
      action: "contributor.onboarding.complete",
      resource: { type: "contributor_profile", id: input.userId },
      payload: {
        source: "meridian_wizard",
        contribType: input.contribType,
        track,
        kycSubmitted: input.kycSubmitted ?? false,
        idUploaded: input.idUploaded ?? false,
        payoutSkipped: input.payoutSkipped ?? true,
      },
      severity: "info",
      actor,
    },
    {},
  );

  return { adminKycCase };
}
