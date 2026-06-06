import type { ContributorType } from "@/app/auth/register/types";
import type { Persona } from "@/mocks/contributor/personas";
import type { ReferralTrack } from "@/lib/referral/context";

/** Persisted on ContributorProfile.contribType */
export type ContribType =
  | "internal"
  | "student"
  | "women_workforce"
  | "general_workforce";

/** Track param from registration / referral URLs */
export type RegistrationTrack = ReferralTrack | "freelancer" | "internal";

export function registrationTrackToContribType(
  track?: string | null,
): ContribType {
  switch (track) {
    case "student":
      return "student";
    case "women_wf":
      return "women_workforce";
    case "internal":
      return "internal";
    case "freelancer":
    case "general_workforce":
    default:
      return "general_workforce";
  }
}

export function contribTypeToPersona(
  contribType?: string | null,
): Persona {
  switch (contribType) {
    case "internal":
      return "internal";
    case "student":
      return "student";
    case "women_workforce":
      return "women";
    case "general_workforce":
      return "freelancer";
    default:
      return "freelancer";
  }
}

export function contribTypeToContributorType(
  contribType?: string | null,
): ContributorType {
  switch (contribType) {
    case "student":
      return "student";
    case "women_workforce":
      return "women_workforce";
    case "general_workforce":
      return "general_workforce";
    default:
      return "";
  }
}

export function isContribType(value: string | null | undefined): value is ContribType {
  return (
    value === "internal" ||
    value === "student" ||
    value === "women_workforce" ||
    value === "general_workforce"
  );
}

export function isOnboardingProfileComplete(profile: {
  contribType: string;
  acceptTos: boolean;
  departmentCategory: string;
} | null | undefined): boolean {
  if (!profile) return false;
  return (
    isContribType(profile.contribType) &&
    profile.acceptTos &&
    profile.departmentCategory !== "pending"
  );
}

export type KycReviewStatus = "not_required" | "pending" | "approved";

/** Tracks that require platform admin identity review before portal access. */
export function contribTypeRequiresKycReview(
  contribType: ContribType | string | null | undefined,
): boolean {
  return contribType === "general_workforce" || contribType === "women_workforce";
}

export function kycReviewStatus(
  contribType: ContribType | string | null | undefined,
  kycVerifiedAt: Date | null | undefined,
): KycReviewStatus {
  if (!contribTypeRequiresKycReview(contribType)) return "not_required";
  return kycVerifiedAt ? "approved" : "pending";
}

export function isContributorPortalReady(input: {
  contribType: ContribType | string | null | undefined;
  kycVerifiedAt: Date | null | undefined;
}): boolean {
  if (!contribTypeRequiresKycReview(input.contribType)) return true;
  return !!input.kycVerifiedAt;
}
