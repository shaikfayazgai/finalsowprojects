"use client";

/**
 * Onboarding · Complete — persists track profile then routes to dashboard.
 */

import * as React from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { AuthShell, AuthCard } from "@/components/auth/auth-shell";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { finalizeReferralOnboarding } from "@/lib/actions/register";
import { registerAdminKycCaseFromOnboarding } from "@/lib/admin/mocks/kyc-service";
import { readReferralContext, clearReferralContext } from "@/lib/referral/context";
import {
  clearOnboardingDraft,
  readOnboardingDraft,
} from "@/lib/contributor/onboarding-draft";
import { ONBOARDING_PATH, requiresKycAdminApproval } from "@/lib/contributor/onboarding-steps";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useInvalidateContributorTrack } from "@/lib/hooks/use-contributor-track";
import { useOnboardingTrack } from "@/lib/hooks/use-onboarding-track";

export default function CompletePage() {
  return (
    <React.Suspense fallback={null}>
      <CompleteInner />
    </React.Suspense>
  );
}

function CompleteInner() {
  const { track, steps } = useOnboardingTrack();
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);
  const invalidateTrack = useInvalidateContributorTrack();
  const [ready, setReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [awaitingKyc, setAwaitingKyc] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const referral = readReferralContext();
      const draft = readOnboardingDraft();
      const effectiveTrack = draft.track ?? referral?.track ?? track;

      const skillNames =
        draft.primarySkills ??
        draft.skills?.map((s) => s.name) ??
        [];

      const result = await finalizeReferralOnboarding({
        track: effectiveTrack,
        country: draft.country ?? draft.kycCountry,
        dob: draft.dob ?? draft.kycDob,
        timezone: draft.timezone,
        availability: draft.availability,
        workStyle: draft.workStyle,
        primarySkills: skillNames,
        secondarySkills: draft.secondarySkills,
        otherSkills: draft.otherSkills,
        degree: draft.degree,
        branch: draft.branch,
        studentId: draft.studentId,
        programme: draft.programme ?? draft.degree,
        supervisorEmail: draft.supervisorEmail,
        supervisorName: draft.supervisorName,
        legalName: draft.legalName ?? draft.kycFullName,
        idType: draft.idType ?? draft.kycIdType,
        idUploaded: draft.idUploaded ?? false,
        referredBy: draft.referredBy,
        wantsPeerMentor: draft.wantsPeerMentor,
        acceptTos: draft.acceptTos,
        acceptCoc: draft.acceptCoc,
        acceptPrivacy: draft.acceptPrivacy,
        acceptFee: draft.acceptFee,
        acceptAhp: draft.acceptAhp,
        marketingOptIn: draft.marketingOptIn,
        kycSubmitted: draft.kycSubmitted ?? false,
        kycIdType: draft.kycIdType ?? draft.idType,
        kycIdNumber: draft.kycIdNumber ?? draft.idNumberLast4,
        payoutSkipped: draft.payoutSkipped ?? true,
      });
      if (cancelled) return;
      if (!result.success) {
        setError(result.error);
        return;
      }
      if (result.adminKycCase) {
        registerAdminKycCaseFromOnboarding(result.adminKycCase);
      }
      clearReferralContext();
      clearOnboardingDraft();
      setOnboardingComplete(true);
      setAwaitingKyc(requiresKycAdminApproval(track) || !!result.adminKycCase);
      invalidateTrack();
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [setOnboardingComplete, invalidateTrack, track]);

  const kycNote =
    track === "freelancer"
      ? "Your profile is saved. We'll email you when identity verification clears."
      : track === "women_wf"
        ? "Your profile is saved. Your partner ID check is queued for review."
        : "";

  const portalHref = awaitingKyc
    ? ONBOARDING_PATH.kycPending
    : "/contributor/dashboard";
  const portalLabel = awaitingKyc ? "View verification status" : "Go to dashboard";

  return (
    <AuthShell>
      <AuthCard
        eyebrow="Onboarding"
        title="You're in."
        subtitle={
          kycNote ||
          "Your profile is set up. We'll route the first tasks your way soon."
        }
      >
        <OnboardingProgress steps={steps} current="/onboarding/complete" />

        {error ? (
          <p role="alert" className="font-body text-[12px] text-error-text text-center">
            {error}
          </p>
        ) : !ready ? (
          <p className="font-body text-[12.5px] text-text-secondary text-center">
            Saving your profile…
          </p>
        ) : (
          <>
            <div className="rounded-lg border border-success-border bg-success-subtle/60 px-5 py-6 text-center space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-success-text text-on-brand mx-auto">
                <Check className="h-6 w-6" strokeWidth={2.5} aria-hidden />
              </div>
              <h2 className="font-display text-[20px] font-semibold text-foreground">Welcome to GlimmoraTeam</h2>
              <p className="font-body text-[12.5px] text-text-secondary max-w-sm mx-auto">
                {awaitingKyc
                  ? "You're almost there — our team is reviewing your identity documents."
                  : "Take a quick tour of your dashboard, or jump straight into the assigned tasks list."}
              </p>
            </div>

            <div className={`grid gap-2 ${awaitingKyc ? "grid-cols-1" : "grid-cols-2"}`}>
              <Link href={portalHref} className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-brand text-on-brand font-body text-[13px] font-semibold hover:bg-brand-hover transition-colors duration-fast">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" strokeWidth={2} aria-hidden /> {portalLabel}
              </Link>
              {!awaitingKyc && (
              <Link href="/contributor/tasks" className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-surface border border-stroke shadow-xs font-body text-[13px] font-semibold text-foreground hover:bg-surface-hover transition-colors duration-fast">
                See assigned tasks
              </Link>
              )}
            </div>
          </>
        )}
      </AuthCard>
    </AuthShell>
  );
}
