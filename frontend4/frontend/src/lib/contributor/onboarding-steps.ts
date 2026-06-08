/**
 * Track-aware onboarding navigation — spec docs/guides/auth-flow.md §6.1,
 * docs/portal-specs/01-contributor-portal.md §5.B.
 */

import type { OnboardingStep } from "@/components/onboarding/onboarding-progress";
import type { ReferralContext } from "@/lib/referral/context";
import type { ContribType } from "@/lib/contributor/track";

export type OnboardingTrackKey = "freelancer" | "student" | "women_wf" | "internal";

export const ONBOARDING_PATH = {
  consent: "/onboarding/consent",
  student: "/onboarding/student",
  women: "/onboarding/women",
  skills: "/onboarding/skills",
  availability: "/onboarding/availability",
  evidence: "/onboarding/evidence",
  verify: "/onboarding/verify",
  payout: "/onboarding/payout",
  complete: "/onboarding/complete",
  kycPending: "/onboarding/kyc-pending",
} as const;

type StepKey = keyof typeof ONBOARDING_PATH;

const TRACK_SEQUENCE: Record<OnboardingTrackKey, StepKey[]> = {
  /** Freelancer: self-registers and works DIRECTLY — no KYC step / no admin
   *  approval gate. consent → skills → availability → evidence → payout → done */
  freelancer: ["consent", "skills", "availability", "evidence", "payout", "complete"],
  /** Student: university step replaces generic KYC */
  student: ["consent", "student", "skills", "availability", "evidence", "payout", "complete"],
  /** Women WF: partner + lightweight ID on women page — no generic verify */
  women_wf: ["consent", "women", "skills", "availability", "evidence", "payout", "complete"],
  /** Internal (HRIS): consent + skills + availability only */
  internal: ["consent", "skills", "availability", "complete"],
};

const STEP_LABELS: Record<StepKey, string> = {
  consent: "Consent",
  student: "University",
  women: "Partner",
  skills: "Skills",
  availability: "Availability",
  evidence: "Evidence",
  verify: "KYC",
  payout: "Payout",
  complete: "Done",
  kycPending: "Verification",
};

export function resolveOnboardingTrack(input: {
  referral?: ReferralContext | null;
  contribType?: ContribType | string | null;
  isInternalEmployee?: boolean;
}): OnboardingTrackKey {
  if (input.isInternalEmployee || input.contribType === "internal") {
    return "internal";
  }
  if (input.referral?.track === "student" || input.contribType === "student") {
    return "student";
  }
  if (input.referral?.track === "women_wf" || input.contribType === "women_workforce") {
    return "women_wf";
  }
  return "freelancer";
}

export function stepsForTrack(track: OnboardingTrackKey): OnboardingStep[] {
  return TRACK_SEQUENCE[track].map((key) => ({
    href: ONBOARDING_PATH[key],
    label: STEP_LABELS[key],
  }));
}

export function pathForStep(key: StepKey, query?: string): string {
  const base = ONBOARDING_PATH[key];
  return query ? `${base}?${query}` : base;
}

export function nextStepPath(
  track: OnboardingTrackKey,
  currentHref: string,
  query?: string,
): string | null {
  const seq = TRACK_SEQUENCE[track];
  const idx = seq.findIndex((k) => ONBOARDING_PATH[k] === currentHref.split("?")[0]);
  if (idx < 0 || idx >= seq.length - 1) return null;
  return pathForStep(seq[idx + 1]!, query);
}

export function requiresKycVerifyPage(_track: OnboardingTrackKey): boolean {
  // Freelancers self-register and work directly — no KYC verify page. (No track
  // currently requires the generic verify page.)
  return false;
}

/** Only the women-workforce track waits for admin KYC approval. Freelancers
 *  register directly and start working immediately; university students are
 *  vouched for by their institution. */
export function requiresKycAdminApproval(track: OnboardingTrackKey): boolean {
  return track === "women_wf";
}

export function buildConsentEntryQuery(referral?: ReferralContext | null): string {
  if (!referral?.ref) return "";
  const q = new URLSearchParams();
  q.set("ref", referral.ref);
  q.set("track", referral.track);
  if (referral.invite) q.set("invite", referral.invite);
  return q.toString();
}

/** All incomplete contributors enter Meridian onboarding here. */
export function resolveIncompleteOnboardingPath(input: {
  referral?: ReferralContext | null;
  contribType?: ContribType | string | null;
  isInternalEmployee?: boolean;
}): string {
  const track = resolveOnboardingTrack(input);
  const q = buildConsentEntryQuery(input.referral);
  if (track === "student" || track === "women_wf") {
    return pathForStep("consent", q || undefined);
  }
  return pathForStep("consent", q || undefined);
}

export function isInsideOnboardingFlow(pathname: string): boolean {
  return pathname.startsWith("/onboarding");
}
