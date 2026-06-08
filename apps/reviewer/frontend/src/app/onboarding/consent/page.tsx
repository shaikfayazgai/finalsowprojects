"use client";

/**
 * Onboarding · Consent — full legal pack per spec §5.B.1.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AuthShell, AuthCard, PrimaryButton } from "@/components/auth/auth-shell";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import {
  buildConsentEntryQuery,
  nextStepPath,
} from "@/lib/contributor/onboarding-steps";
import {
  patchOnboardingDraft,
  readOnboardingDraft,
} from "@/lib/contributor/onboarding-draft";
import { persistReferralContext } from "@/lib/referral/context";
import { useOnboardingTrack } from "@/lib/hooks/use-onboarding-track";

export default function ConsentPage() {
  return (
    <React.Suspense fallback={null}>
      <ConsentInner />
    </React.Suspense>
  );
}

function ConsentInner() {
  const router = useRouter();
  const { track, steps, referral } = useOnboardingTrack();
  const saved = React.useMemo(() => readOnboardingDraft(), []);

  const [terms, setTerms] = React.useState(saved.acceptTos ?? false);
  const [privacy, setPrivacy] = React.useState(saved.acceptPrivacy ?? false);
  const [coc, setCoc] = React.useState(saved.acceptCoc ?? false);
  const [ahp, setAhp] = React.useState(saved.acceptAhp ?? false);
  const [fee, setFee] = React.useState(saved.acceptFee ?? false);
  const [evidenceConsent, setEvidenceConsent] = React.useState(
    saved.evidenceConsent ?? true,
  );
  const [notify, setNotify] = React.useState(saved.notifyOptIn ?? true);
  const [aiGuide, setAiGuide] = React.useState(saved.aiGuidanceOptIn ?? true);
  const [marketing, setMarketing] = React.useState(saved.marketingOptIn ?? false);

  const can = terms && privacy && coc && ahp && fee;

  React.useEffect(() => {
    if (referral) {
      persistReferralContext(referral.ref, referral.track, referral.invite);
    }
  }, [referral]);

  function next() {
    if (!can) return;

    if (track === "student" && !referral?.invite) {
      router.replace("/auth/register?error=student-invite-required");
      return;
    }
    if (track === "women_wf" && !referral?.invite) {
      router.replace("/auth/register?error=ww-invite-required");
      return;
    }

    patchOnboardingDraft({
      track,
      acceptTos: terms,
      acceptPrivacy: privacy,
      acceptCoc: coc,
      acceptAhp: ahp,
      acceptFee: fee,
      evidenceConsent,
      notifyOptIn: notify,
      aiGuidanceOptIn: aiGuide,
      marketingOptIn: marketing,
    });

    const q = buildConsentEntryQuery(referral);
    const dest = nextStepPath(track, "/onboarding/consent", q || undefined);
    if (dest) router.push(dest);
  }

  return (
    <AuthShell>
      <AuthCard
        eyebrow="Onboarding"
        title="A few quick agreements"
        subtitle="Please confirm so we can route you to work and pay you for it."
      >
        <OnboardingProgress steps={steps} current="/onboarding/consent" />

        <div className="rounded-lg border border-stroke bg-surface shadow-xs">
          <div className="px-4 py-3 border-b border-stroke-subtle flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand-emphasis" strokeWidth={2} aria-hidden />
            <h2 className="font-body text-[12.5px] font-semibold text-foreground">Required</h2>
          </div>
          <ul className="px-4 py-3 space-y-3">
            <Item checked={terms} onChange={setTerms} title="Platform Terms of Service" body={<>I agree to the <Link href="/legal/terms" className="text-brand-emphasis hover:underline underline-offset-2">Terms</Link>, including conduct standards and submission ownership.</>} />
            <Item checked={privacy} onChange={setPrivacy} title="Privacy Policy" body={<>I understand how GlimmoraTeam handles my data per the <Link href="/legal/privacy" className="text-brand-emphasis hover:underline underline-offset-2">Privacy Policy</Link>.</>} />
            <Item checked={coc} onChange={setCoc} title="Code of Conduct" body="I agree to the platform Code of Conduct, including professional behaviour on tasks and in community spaces." />
            <Item checked={ahp} onChange={setAhp} title="Anti-harassment policy" body="I acknowledge the anti-harassment policy and understand how to report concerns." />
            <Item checked={fee} onChange={setFee} title="Platform fee acknowledgment" body="I understand Glimmora's platform fee structure and payout timelines as described in the Terms." />
          </ul>
        </div>

        <div className="rounded-lg border border-stroke bg-surface shadow-xs">
          <div className="px-4 py-3 border-b border-stroke-subtle">
            <h2 className="font-body text-[12.5px] font-semibold text-foreground">Optional</h2>
          </div>
          <ul className="px-4 py-3 space-y-3">
            <Item checked={evidenceConsent} onChange={setEvidenceConsent} title="Evidence for credentials" body="I consent to completed submissions being used to issue verifiable credentials I can share publicly." />
            <Item checked={notify} onChange={setNotify} title="Task notifications" body="Email me when new tasks match my skills." />
            <Item checked={aiGuide} onChange={setAiGuide} title="AI guidance" body="Show in-app tips for improving match quality and submission quality." />
            <Item checked={marketing} onChange={setMarketing} title="Product updates" body="Occasional emails about new features and programmes." />
          </ul>
        </div>

        <PrimaryButton onClick={next} disabled={!can}>Continue →</PrimaryButton>
      </AuthCard>
    </AuthShell>
  );
}

function Item({ checked, onChange, title, body }: { checked: boolean; onChange: (v: boolean) => void; title: string; body: React.ReactNode }) {
  return (
    <li>
      <label className="flex gap-3 cursor-pointer items-start">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-3.5 w-3.5 rounded border-stroke text-brand focus:ring-brand" />
        <div className="flex-1">
          <p className="font-body text-[12.5px] font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 font-body text-[11.5px] text-text-secondary leading-relaxed">{body}</p>
        </div>
      </label>
    </li>
  );
}
