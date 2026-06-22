"use client";

/**
 * Onboarding · KYC verification — freelancer track only (spec §5.B.7).
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Upload, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { AuthShell, AuthCard, FieldLabel, inputCls, PrimaryButton, SecondaryButton } from "@/components/auth/auth-shell";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { patchOnboardingDraft, readOnboardingDraft } from "@/lib/contributor/onboarding-draft";
import { nextStepPath, requiresKycVerifyPage } from "@/lib/contributor/onboarding-steps";
import { useOnboardingTrack } from "@/lib/hooks/use-onboarding-track";
import { cn } from "@/lib/utils/cn";

const ID_TYPES = ["Aadhaar", "Passport", "Driving Licence", "National ID"] as const;

export default function VerifyPage() {
  return (
    <React.Suspense fallback={null}>
      <VerifyInner />
    </React.Suspense>
  );
}

function VerifyInner() {
  const router = useRouter();
  const { track, steps } = useOnboardingTrack();
  const saved = React.useMemo(() => readOnboardingDraft(), []);

  const [fullName, setFullName] = React.useState(saved.kycFullName ?? "");
  const [dob, setDob] = React.useState(saved.kycDob ?? "");
  const [country, setCountry] = React.useState(saved.kycCountry ?? "India");
  const [idType, setIdType] = React.useState<(typeof ID_TYPES)[number]>(
    (saved.kycIdType as (typeof ID_TYPES)[number]) ?? "Aadhaar",
  );
  const [idNumber, setIdNumber] = React.useState(saved.kycIdNumber ?? "");
  const [file, setFile] = React.useState<File | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!requiresKycVerifyPage(track)) {
      const dest = nextStepPath(track, "/onboarding/verify");
      if (dest) router.replace(dest);
    }
  }, [track, router]);

  const can = fullName.trim().length >= 3 && !!dob && idNumber.trim().length >= 4 && !!file && !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!can) return;
    setError(null);
    setSubmitting(true);
    try {
      patchOnboardingDraft({
        kycFullName: fullName.trim(),
        kycDob: dob,
        kycCountry: country,
        kycIdType: idType,
        kycIdNumber: idNumber.trim(),
        kycSubmitted: true,
        country,
        dob,
        legalName: fullName.trim(),
      });
      await new Promise((r) => setTimeout(r, 700));
      setSubmitted(true);
      setTimeout(() => {
        const dest = nextStepPath(track, "/onboarding/verify");
        if (dest) router.push(dest);
      }, 1800);
    } catch {
      setError("Couldn't submit your KYC. Try again or contact support.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!requiresKycVerifyPage(track)) {
    return null;
  }

  return (
    <AuthShell>
      <AuthCard
        eyebrow="Identity verification"
        title={submitted ? "KYC submitted" : "Verify your identity"}
        subtitle={submitted
          ? "Our Trust & Safety team will review your submission. You'll get an email within 8 business hours."
          : "We need to verify your identity once. Everything is encrypted; only T&S can view your documents."}
      >
        <OnboardingProgress steps={steps} current="/onboarding/verify" />

        {submitted ? (
          <div className="rounded-md border border-success-border bg-success-subtle px-4 py-3 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-success-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
            <p className="font-body text-[12.5px] text-success-text">Continuing to payout setup…</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            {error && (
              <div role="alert" className="rounded-md border border-error-border bg-error-subtle px-3 py-2 flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
                <p className="font-body text-[12.5px] text-error-text flex-1">{error}</p>
              </div>
            )}
            <div className="rounded-md border border-brand-border bg-brand-subtle/60 px-3 py-2 flex items-start gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-emphasis mt-0.5 shrink-0" strokeWidth={2} aria-hidden />
              <p className="font-body text-[11.5px] text-text-secondary">Documents are stored encrypted. Numbers are stored with only the last 4 digits visible.</p>
            </div>
            <div>
              <FieldLabel htmlFor="full">Full name (as on ID)</FieldLabel>
              <input id="full" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel htmlFor="dob">Date of birth</FieldLabel>
                <input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={inputCls} required />
              </div>
              <div>
                <FieldLabel htmlFor="country">Country</FieldLabel>
                <select id="country" value={country} onChange={(e) => setCountry(e.target.value)} className={inputCls}>
                  <option>India</option><option>USA</option><option>UK</option><option>Singapore</option><option>UAE</option><option>Germany</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel htmlFor="idtype">ID type</FieldLabel>
                <select id="idtype" value={idType} onChange={(e) => setIdType(e.target.value as typeof idType)} className={inputCls}>
                  {ID_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel htmlFor="idnum">ID number</FieldLabel>
                <input id="idnum" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} className={cn(inputCls, "font-mono tabular-nums")} required />
              </div>
            </div>
            <div>
              <FieldLabel>Upload ID document</FieldLabel>
              <label className="block">
                <input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="sr-only" />
                <span className={cn("block cursor-pointer rounded-md border border-dashed border-stroke bg-bg-subtle/40 px-3 py-4 text-center font-body text-[12.5px] transition-colors hover:bg-bg-subtle", file ? "text-foreground" : "text-text-tertiary")}>
                  {file ? (
                    <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success-text" strokeWidth={2} aria-hidden />{file.name}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5"><Upload className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />Click to choose a photo or PDF (max 10MB)</span>
                  )}
                </span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <SecondaryButton onClick={() => router.push("/onboarding/evidence")}>← Back</SecondaryButton>
              <PrimaryButton type="submit" disabled={!can} loading={submitting}>Submit for review</PrimaryButton>
            </div>
          </form>
        )}
      </AuthCard>
    </AuthShell>
  );
}
