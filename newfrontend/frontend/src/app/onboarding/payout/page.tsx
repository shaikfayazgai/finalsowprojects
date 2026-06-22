"use client";

/**
 * Onboarding · Payout — optional Razorpay setup (spec §5.B.8, deferrable).
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { AuthShell, AuthCard, FieldLabel, inputCls, PrimaryButton, SecondaryButton } from "@/components/auth/auth-shell";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { patchOnboardingDraft } from "@/lib/contributor/onboarding-draft";
import { nextStepPath } from "@/lib/contributor/onboarding-steps";
import { useOnboardingTrack } from "@/lib/hooks/use-onboarding-track";

export default function PayoutPage() {
  return (
    <React.Suspense fallback={null}>
      <PayoutInner />
    </React.Suspense>
  );
}

function PayoutInner() {
  const router = useRouter();
  const { track, steps } = useOnboardingTrack();
  const [accountName, setAccountName] = React.useState("");
  const [ifsc, setIfsc] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState("");

  function skip() {
    patchOnboardingDraft({ payoutSkipped: true });
    const dest = nextStepPath(track, "/onboarding/payout");
    if (dest) router.push(dest);
  }

  function saveAndContinue() {
    patchOnboardingDraft({ payoutSkipped: false });
    const dest = nextStepPath(track, "/onboarding/payout");
    if (dest) router.push(dest);
  }

  const canSave =
    accountName.trim().length >= 2 &&
    ifsc.trim().length >= 4 &&
    accountNumber.trim().length >= 6;

  return (
    <AuthShell>
      <AuthCard
        eyebrow="Payout"
        title="Where should we pay you?"
        subtitle="Link a bank account now or skip — you can add payout details from Earnings anytime."
      >
        <OnboardingProgress steps={steps} current="/onboarding/payout" />

        <div className="rounded-lg border border-stroke bg-surface shadow-xs p-4 space-y-3">
          <div className="flex items-center gap-2 text-brand-emphasis">
            <Wallet className="h-4 w-4" strokeWidth={2} aria-hidden />
            <h2 className="font-body text-[12.5px] font-semibold text-foreground">Bank account (India)</h2>
          </div>
          <div>
            <FieldLabel htmlFor="acct-name">Account holder name</FieldLabel>
            <input id="acct-name" value={accountName} onChange={(e) => setAccountName(e.target.value)} className={inputCls} placeholder="As on bank records" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel htmlFor="ifsc">IFSC</FieldLabel>
              <input id="ifsc" value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} className={inputCls} placeholder="HDFC0001234" />
            </div>
            <div>
              <FieldLabel htmlFor="acct">Account number</FieldLabel>
              <input id="acct" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className={inputCls} inputMode="numeric" />
            </div>
          </div>
          <p className="font-body text-[11.5px] text-text-tertiary">
            Payouts are processed via Razorpay. We verify account ownership before your first withdrawal.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <SecondaryButton onClick={skip}>Skip for now</SecondaryButton>
          <PrimaryButton onClick={saveAndContinue} disabled={!canSave}>Save & continue →</PrimaryButton>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
