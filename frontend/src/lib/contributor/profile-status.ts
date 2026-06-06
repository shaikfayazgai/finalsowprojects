import { prisma } from "@/lib/db";
import {
  resolveOnboardingTrack,
  type OnboardingTrackKey,
} from "@/lib/contributor/onboarding-steps";
import {
  contribTypeToPersona,
  isContributorPortalReady,
  isOnboardingProfileComplete,
  kycReviewStatus,
  type ContribType,
  type KycReviewStatus,
} from "@/lib/contributor/track";

export interface ContributorTrackProfile {
  country: string;
  timezone: string;
  degree: string | null;
  branch: string | null;
  departmentCategory: string;
  departmentOther: string | null;
  availability: string;
  primarySkills: string[];
  linkedin: string | null;
}

export interface ContributorTrackStatus {
  onboardingComplete: boolean;
  /** True when the contributor may use the portal (KYC-cleared if required). */
  portalReady: boolean;
  kycReviewStatus: KycReviewStatus;
  onboardingTrack: OnboardingTrackKey;
  contribType: ContribType | null;
  persona: ReturnType<typeof contribTypeToPersona>;
  profile: ContributorTrackProfile | null;
  orgChip: { tenant: string; department: string } | null;
  /** Student-specific — populated when supervisorEmail is set on profile (§5.C.3.b). */
  supervision: {
    supervisorName: string;
    institution: string;
    supervisorEmail: string;
    isApproved: boolean;
    approvedAt: string | null;
    creditTasksTotal: number;
    creditTasksCompleted: number;
    termEndsAt: string | null;
  } | null;
  /** Women-workforce — null until mentor/check-in data is persisted (§5.C.3.c). */
  womenSupport: {
    peerMentor: { name: string; initials: string };
    nextCheckIn: { iso: string; durationMin: number };
    activePreferences: string[];
  } | null;
}

function departmentLabel(category: string, other: string | null): string {
  if (category === "other" && other?.trim()) return other.trim();
  return category.replace(/_/g, " ");
}

function studentSupervisionFromProfile(
  cp: {
    supervisorEmail: string | null;
    supervisorName: string | null;
    supervisorApprovedAt: Date | null;
  },
  profile: ContributorTrackProfile,
): ContributorTrackStatus["supervision"] {
  const email = cp.supervisorEmail?.trim();
  if (!email) return null;

  return {
    supervisorName: cp.supervisorName?.trim() || "Faculty supervisor",
    institution:
      profile.branch?.trim() ||
      profile.degree?.trim() ||
      "Your university",
    supervisorEmail: email,
    isApproved: !!cp.supervisorApprovedAt,
    approvedAt: cp.supervisorApprovedAt
      ? cp.supervisorApprovedAt.toISOString().slice(0, 10)
      : null,
    creditTasksTotal: 0,
    creditTasksCompleted: 0,
    termEndsAt: null,
  };
}

export async function getContributorTrackStatus(
  userId: string,
): Promise<ContributorTrackStatus | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      tenantId: true,
      tenant: { select: { name: true } },
      contributorProfile: true,
    },
  });

  if (!user) return null;

  const cp = user.contributorProfile;
  const onboardingComplete = isOnboardingProfileComplete(cp);
  const portalReady =
    onboardingComplete &&
    isContributorPortalReady({
      contribType: cp?.contribType ?? null,
      kycVerifiedAt: cp?.kycVerifiedAt ?? null,
    });
  const kycReview = kycReviewStatus(
    cp?.contribType ?? null,
    cp?.kycVerifiedAt ?? null,
  );
  const contribType = cp?.contribType && cp.contribType.length > 0
    ? (cp.contribType as ContribType)
    : null;
  const persona = contribTypeToPersona(contribType);
  const onboardingTrack = resolveOnboardingTrack({
    contribType,
    isInternalEmployee: !!user.tenantId || contribType === "internal",
  });

  const profile: ContributorTrackProfile | null = cp
    ? {
        country: cp.country,
        timezone: cp.timezone,
        degree: cp.degree,
        branch: cp.branch,
        departmentCategory: cp.departmentCategory,
        departmentOther: cp.departmentOther,
        availability: cp.availability,
        primarySkills: cp.primarySkills,
        linkedin: cp.linkedin,
      }
    : null;

  let orgChip: ContributorTrackStatus["orgChip"] = null;
  if (persona === "internal" && user.tenant?.name && profile) {
    orgChip = {
      tenant: user.tenant.name,
      department: departmentLabel(
        profile.departmentCategory,
        profile.departmentOther,
      ),
    };
  }

  // Supervision card only when student chose a supervisor during onboarding.
  const supervision =
    persona === "student" && profile && cp && onboardingComplete
      ? studentSupervisionFromProfile(cp, profile)
      : null;
  const womenSupport: ContributorTrackStatus["womenSupport"] = null;

  return {
    onboardingComplete,
    portalReady,
    kycReviewStatus: kycReview,
    onboardingTrack,
    contribType,
    persona,
    profile,
    orgChip,
    supervision,
    womenSupport,
  };
}

/** Stub profile written at lightweight signup — onboarding still required. */
export function stubContributorProfileData(contribType: ContribType) {
  return {
    contribType,
    country: "",
    dob: new Date("2000-01-01"),
    timezone: "UTC",
    departmentCategory: "pending",
    departmentOther: null as string | null,
    primarySkills: [] as string[],
    secondarySkills: [] as string[],
    otherSkills: [] as string[],
    availability: "0",
    ndaAccepted: false,
    ndaSignature: "",
    acceptTos: false,
    acceptCoc: false,
    acceptPrivacy: false,
    acceptFee: false,
    acceptAhp: false,
    marketingOptIn: false,
  };
}
