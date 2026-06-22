/**
 * Client-side onboarding draft persisted across `/onboarding/*` steps.
 * Finalized server-side on /onboarding/complete.
 */

const STORAGE_KEY = "gt_onboarding_draft.v2";

export type SkillLevel = "L1" | "L2" | "L3" | "L4";

export interface OnboardingSkillEntry {
  name: string;
  level: SkillLevel;
}

export interface OnboardingDraft {
  track?: "freelancer" | "student" | "women_wf" | "internal";
  /** Legal consents (consent step) */
  acceptTos?: boolean;
  acceptPrivacy?: boolean;
  acceptCoc?: boolean;
  acceptAhp?: boolean;
  acceptFee?: boolean;
  evidenceConsent?: boolean;
  notifyOptIn?: boolean;
  aiGuidanceOptIn?: boolean;
  marketingOptIn?: boolean;
  /** Skills */
  skills?: OnboardingSkillEntry[];
  primarySkills?: string[];
  secondarySkills?: string[];
  otherSkills?: string[];
  /** Availability */
  availability?: string;
  timezone?: string;
  workStyle?: "async" | "live" | "either";
  /** Student track */
  degree?: string;
  branch?: string;
  studentId?: string;
  programme?: string;
  supervisorEmail?: string;
  supervisorName?: string;
  /** Women track — lightweight KYC on partner step (spec §5.B.3) */
  legalName?: string;
  country?: string;
  dob?: string;
  idType?: string;
  idNumberLast4?: string;
  idUploaded?: boolean;
  referredBy?: string;
  wantsPeerMentor?: boolean;
  womenPrefs?: string[];
  /** Freelancer KYC (verify step) */
  kycFullName?: string;
  kycDob?: string;
  kycCountry?: string;
  kycIdType?: string;
  kycIdNumber?: string;
  kycSubmitted?: boolean;
  /** Payout */
  payoutSkipped?: boolean;
  evidenceSkipped?: boolean;
}

export function readOnboardingDraft(): OnboardingDraft {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OnboardingDraft) : {};
  } catch {
    return {};
  }
}

export function patchOnboardingDraft(patch: Partial<OnboardingDraft>): OnboardingDraft {
  if (typeof window === "undefined") return { ...patch };
  const next = { ...readOnboardingDraft(), ...patch };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* best effort */
  }
  return next;
}

export function clearOnboardingDraft(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

/** @deprecated use readOnboardingDraft */
export function readLiteOnboardingDraft(): OnboardingDraft {
  return readOnboardingDraft();
}

/** @deprecated use patchOnboardingDraft */
export function patchLiteOnboardingDraft(patch: Partial<OnboardingDraft>): void {
  patchOnboardingDraft(patch);
}

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  L1: "L1 — Familiar",
  L2: "L2 — Competent",
  L3: "L3 — Strong",
  L4: "L4 — Expert",
};
