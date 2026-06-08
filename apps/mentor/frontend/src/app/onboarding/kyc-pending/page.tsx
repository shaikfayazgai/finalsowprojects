"use client";

/**
 * Post-onboarding holding page — freelancer & women WF wait for admin KYC.
 * University students skip this (membership validated via invite + supervisor).
 */

import * as React from "react";
import Link from "next/link";
import { Clock, Mail, ShieldCheck } from "lucide-react";
import { AuthShell, AuthCard } from "@/components/auth/auth-shell";
import { useContributorTrack, trackLoading, useInvalidateContributorTrack } from "@/lib/hooks/use-contributor-track";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ONBOARDING_PATH } from "@/lib/contributor/onboarding-steps";

export default function KycPendingPage() {
  const router = useRouter();
  const { status } = useSession();
  const trackQuery = useContributorTrack();
  const invalidateTrack = useInvalidateContributorTrack();
  const ready = status === "authenticated" && !trackLoading(status, trackQuery);

  React.useEffect(() => {
    if (status !== "authenticated") return;
    const id = window.setInterval(() => invalidateTrack(), 30_000);
    return () => window.clearInterval(id);
  }, [status, invalidateTrack]);

  React.useEffect(() => {
    if (!ready || !trackQuery.data) return;

    if (!trackQuery.data.onboardingComplete) {
      router.replace(ONBOARDING_PATH.consent);
      return;
    }

    if (trackQuery.data.portalReady) {
      router.replace("/contributor/dashboard");
    }
  }, [ready, trackQuery.data, router]);

  const track = trackQuery.data?.onboardingTrack;
  const isWomen = track === "women_wf";

  return (
    <AuthShell>
      <AuthCard
        eyebrow="Identity verification"
        title="We're reviewing your documents"
        subtitle={
          isWomen
            ? "Your partner ID check is in the queue. You'll get an email when you're cleared to work."
            : "Your KYC submission is in the queue. You'll get an email when you're cleared to work."
        }
      >
        <div className="rounded-lg border border-stroke bg-bg-subtle/60 px-5 py-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <ShieldCheck className="h-5 w-5" strokeWidth={2} aria-hidden />
            </div>
            <div className="space-y-1 min-w-0">
              <p className="font-body text-[13px] font-semibold text-foreground">
                What happens next
              </p>
              <p className="font-body text-[12.5px] text-text-secondary leading-relaxed">
                Our Trust &amp; Safety team typically reviews submissions within one business day.
                Once approved, your dashboard, tasks, and payout setup will unlock automatically.
              </p>
            </div>
          </div>

          <ul className="space-y-2 font-body text-[12px] text-text-secondary">
            <li className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-text-tertiary shrink-0" aria-hidden />
              Status: <span className="font-medium text-foreground">Pending review</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-text-tertiary shrink-0" aria-hidden />
              We'll email you at sign-in when verification is complete.
            </li>
          </ul>
        </div>

        <p className="font-body text-[11.5px] text-text-tertiary text-center">
          Need help?{" "}
          <Link
            href="/contributor/support"
            className="text-brand hover:text-brand-hover underline-offset-2 hover:underline"
          >
            Contact support
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
