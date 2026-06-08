"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { readReferralContext } from "@/lib/referral/context";
import { resolveIncompleteOnboardingPath } from "@/lib/contributor/onboarding-routing";
import { useContributorTrack } from "@/lib/hooks/use-contributor-track";

/** Legacy SSO route — redirects into unified Meridian onboarding. */
export default function ContributorOnboardingPage() {
  const router = useRouter();
  const trackQuery = useContributorTrack();

  useEffect(() => {
    if (trackQuery.isLoading) return;
    const target = resolveIncompleteOnboardingPath({
      contribType: trackQuery.data?.contribType,
      referral: readReferralContext(),
      isInternalEmployee: trackQuery.data?.onboardingTrack === "internal",
    });
    router.replace(target);
  }, [router, trackQuery.data, trackQuery.isLoading]);

  return (
    <p className="font-body text-[13px] text-text-secondary text-center py-12">
      Redirecting to onboarding…
    </p>
  );
}
