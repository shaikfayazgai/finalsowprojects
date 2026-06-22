"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  resolveOnboardingTrack,
  stepsForTrack,
  type OnboardingTrackKey,
} from "@/lib/contributor/onboarding-steps";
import { useContributorTrack } from "@/lib/hooks/use-contributor-track";
import {
  readReferralContext,
  resolveReferralFromSearch,
} from "@/lib/referral/context";
import { patchOnboardingDraft } from "@/lib/contributor/onboarding-draft";

export function useOnboardingTrack() {
  const sp = useSearchParams();
  const { data: session } = useSession();
  const trackQuery = useContributorTrack();

  const referral = useMemo(
    () => resolveReferralFromSearch(sp) ?? readReferralContext(),
    [sp],
  );

  const track: OnboardingTrackKey = useMemo(() => {
    const fromApi = trackQuery.data;
    return resolveOnboardingTrack({
      referral,
      contribType: fromApi?.contribType,
      isInternalEmployee:
        fromApi?.onboardingTrack === "internal" || !!fromApi?.orgChip,
    });
  }, [referral, trackQuery.data]);

  const steps = useMemo(() => stepsForTrack(track), [track]);

  useEffect(() => {
    patchOnboardingDraft({ track });
  }, [track]);

  return {
    track,
    steps,
    referral,
    session,
    trackLoading: trackQuery.isLoading,
  };
}
