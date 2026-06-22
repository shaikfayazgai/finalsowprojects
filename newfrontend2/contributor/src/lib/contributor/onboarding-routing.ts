import {
  buildConsentEntryQuery,
  pathForStep,
  resolveOnboardingTrack,
  type OnboardingTrackKey,
} from "@/lib/contributor/onboarding-steps";
import type { ReferralContext } from "@/lib/referral/context";
import type { ContribType } from "@/lib/contributor/track";

/**
 * Where to send a contributor whose profile is not yet complete.
 * All tracks use the unified Meridian `/onboarding/*` flow (spec §6.1).
 */
export function resolveIncompleteOnboardingPath(input: {
  provider?: string | null;
  isNewSsoUser?: boolean;
  contribType?: ContribType | string | null;
  referral?: ReferralContext | null;
  isInternalEmployee?: boolean;
}): string {
  const track = resolveOnboardingTrack({
    referral: input.referral,
    contribType: input.contribType,
    isInternalEmployee: input.isInternalEmployee,
  });
  const q = buildConsentEntryQuery(input.referral);
  void track;
  return pathForStep("consent", q || undefined);
}

/** True when the user is already inside an onboarding route (don't redirect loop). */
export function isInsideOnboardingFlow(pathname: string): boolean {
  return (
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/contributor/onboarding")
  );
}

export type { OnboardingTrackKey };
