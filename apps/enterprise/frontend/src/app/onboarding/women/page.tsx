"use client";

/**
 * Onboarding · Women workforce track — partner details + lightweight ID (spec §5.B.3).
 */

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HeartHandshake, AlertCircle, Upload, CheckCircle2, ShieldCheck } from "lucide-react";
import { AuthShell, AuthCard, FieldLabel, inputCls, PrimaryButton } from "@/components/auth/auth-shell";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import {
  confirmWWContributorEnrollment,
  listAdminWWPartners,
  resolveWWContributorInvite,
} from "@/lib/admin/mocks/partnerships-service";
import { readReferralContext } from "@/lib/referral/context";
import { patchOnboardingDraft } from "@/lib/contributor/onboarding-draft";
import { nextStepPath } from "@/lib/contributor/onboarding-steps";
import { useOnboardingTrack } from "@/lib/hooks/use-onboarding-track";
import { cn } from "@/lib/utils/cn";

const ID_TYPES = ["Aadhaar", "Passport", "Driving Licence", "National ID"] as const;

export default function WomenOnboardingPage() {
  return (
    <React.Suspense fallback={null}>
      <Inner />
    </React.Suspense>
  );
}

function Inner() {
  const router = useRouter();
  const sp = useSearchParams();
  const { track, steps } = useOnboardingTrack();
  const partners = listAdminWWPartners();
  const refId = sp.get("ref") ?? readReferralContext()?.ref;
  const inviteToken = sp.get("invite") ?? readReferralContext()?.invite;
  const wwInvite = inviteToken ? resolveWWContributorInvite(inviteToken) : null;
  const referredPartner = wwInvite?.partner ?? (refId ? partners.find((w) => w.id === refId) : undefined);

  const [referredBy, setReferredBy] = React.useState("");
  const [supervisor, setSupervisor] = React.useState("");
  const [mentorshipPair, setMentorshipPair] = React.useState(true);
  const [legalName, setLegalName] = React.useState("");
  const [dob, setDob] = React.useState("");
  const [country, setCountry] = React.useState("India");
  const [idType, setIdType] = React.useState<(typeof ID_TYPES)[number]>("Aadhaar");
  const [idFile, setIdFile] = React.useState<File | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!wwInvite || !inviteToken) {
      router.replace("/auth/register?error=ww-invite-required");
      return;
    }
    if (refId && wwInvite.partner.id !== refId) {
      router.replace("/auth/register?error=ww-invite-required");
    }
  }, [wwInvite, inviteToken, refId, router]);

  React.useEffect(() => {
    if (!wwInvite) return;
    if (wwInvite.contributor.referredBy) setReferredBy(wwInvite.contributor.referredBy);
    if (wwInvite.contributor.supervisorEmail) setSupervisor(wwInvite.contributor.supervisorEmail);
    if (wwInvite.contributor.wantsPeerMentor !== undefined) {
      setMentorshipPair(wwInvite.contributor.wantsPeerMentor);
    }
  }, [wwInvite]);

  const org = referredPartner;
  const can =
    !!org &&
    !!inviteToken &&
    !!wwInvite &&
    referredBy.trim().length >= 2 &&
    legalName.trim().length >= 3 &&
    !!dob &&
    !!idFile;

  async function onContinue() {
    if (!can || !org || !inviteToken) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const session = await fetch("/api/auth/session", { cache: "no-store" }).then((r) => r.json()) as {
        user?: { name?: string | null; email?: string | null };
      };
      const email = session.user?.email?.trim().toLowerCase() ?? "";
      const name = session.user?.name?.trim() || "Contributor";
      if (!email) {
        router.replace("/auth/login");
        return;
      }
      const updated = confirmWWContributorEnrollment(org.id, {
        name,
        email,
        referredBy: referredBy.trim(),
        supervisorEmail: supervisor.trim() || undefined,
        wantsPeerMentor: mentorshipPair,
        inviteToken,
      });
      if (!updated) {
        throw new Error("Could not save partner details — check you used your invite email to register.");
      }
      patchOnboardingDraft({
        track: "women_wf",
        referredBy: referredBy.trim(),
        supervisorEmail: supervisor.trim() || undefined,
        wantsPeerMentor: mentorshipPair,
        legalName: legalName.trim(),
        dob,
        country,
        idType,
        idUploaded: true,
      });
      const dest = nextStepPath(track, "/onboarding/women");
      if (dest) router.push(dest);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!wwInvite || !org) {
    return null;
  }

  return (
    <AuthShell>
      <AuthCard
        eyebrow="Women workforce track"
        title="Your partner organisation"
        subtitle="Confirm your partner details and upload a lightweight ID check — no separate KYC step later."
      >
        <OnboardingProgress steps={steps} current="/onboarding/women" />

        <div className="rounded-lg border border-stroke bg-surface shadow-xs p-4 space-y-3">
          <div className="flex items-center gap-2 text-brand-emphasis">
            <HeartHandshake className="h-4 w-4" strokeWidth={2} aria-hidden />
            <h2 className="font-body text-[12.5px] font-semibold text-foreground">Partner organisation</h2>
          </div>
          <div>
            <FieldLabel htmlFor="org">Organisation</FieldLabel>
            <input
              id="org"
              readOnly
              value={`${org.name} · ${org.country}`}
              className={`${inputCls} bg-bg-subtle cursor-default`}
            />
            <p className="mt-1 font-body text-[11.5px] text-text-secondary">
              Locked to your personal invite for {wwInvite.contributor.email}.
            </p>
          </div>
          <div>
            <FieldLabel htmlFor="ref">Referred by (name)</FieldLabel>
            <input id="ref" value={referredBy} onChange={(e) => setReferredBy(e.target.value)} className={inputCls} placeholder={org.leadContact.name} required />
          </div>
          <div>
            <FieldLabel htmlFor="sup">Supervision contact (optional)</FieldLabel>
            <input id="sup" type="email" value={supervisor} onChange={(e) => setSupervisor(e.target.value)} className={inputCls} placeholder="supervisor@partner.org" />
          </div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={mentorshipPair} onChange={(e) => setMentorshipPair(e.target.checked)} className="mt-0.5 h-3.5 w-3.5 rounded border-stroke text-brand focus:ring-brand" />
            <div className="flex-1">
              <p className="font-body text-[12.5px] font-semibold text-foreground">Pair me with a peer mentor</p>
              <p className="mt-0.5 font-body text-[11.5px] text-text-secondary">A senior contributor from {org.name} who can answer questions in your first 30 days.</p>
            </div>
          </label>
          {org && !org.programs.includes("Mentorship pairing") && (
            <p className="font-body text-[11.5px] text-warning-text flex items-start gap-1.5">
              <AlertCircle className="h-3 w-3 mt-0.5" strokeWidth={2} aria-hidden />
              This partner doesn&apos;t currently run a peer-mentor program; we&apos;ll match you with a Glimmora mentor instead.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-stroke bg-surface shadow-xs p-4 space-y-3">
          <div className="flex items-center gap-2 text-brand-emphasis">
            <ShieldCheck className="h-4 w-4" strokeWidth={2} aria-hidden />
            <h2 className="font-body text-[12.5px] font-semibold text-foreground">Lightweight ID check</h2>
          </div>
          <div>
            <FieldLabel htmlFor="legal">Full legal name</FieldLabel>
            <input id="legal" value={legalName} onChange={(e) => setLegalName(e.target.value)} className={inputCls} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel htmlFor="dob">Date of birth</FieldLabel>
              <input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={inputCls} required />
            </div>
            <div>
              <FieldLabel htmlFor="country">Country</FieldLabel>
              <select id="country" value={country} onChange={(e) => setCountry(e.target.value)} className={inputCls}>
                <option>India</option><option>USA</option><option>UK</option><option>Singapore</option><option>UAE</option>
              </select>
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="idtype">ID type</FieldLabel>
            <select id="idtype" value={idType} onChange={(e) => setIdType(e.target.value as typeof idType)} className={inputCls}>
              {ID_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel>Upload ID (photo or PDF)</FieldLabel>
            <label className="block">
              <input type="file" accept="image/*,application/pdf" onChange={(e) => setIdFile(e.target.files?.[0] ?? null)} className="sr-only" />
              <span className={cn("block cursor-pointer rounded-md border border-dashed border-stroke bg-bg-subtle/40 px-3 py-4 text-center font-body text-[12.5px] transition-colors hover:bg-bg-subtle", idFile ? "text-foreground" : "text-text-tertiary")}>
                {idFile ? (
                  <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success-text" strokeWidth={2} aria-hidden />{idFile.name}</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5"><Upload className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />Choose file (max 10MB)</span>
                )}
              </span>
            </label>
          </div>
        </div>

        {formError && (
          <p role="alert" className="font-body text-[12px] text-error-text">{formError}</p>
        )}

        <PrimaryButton onClick={onContinue} disabled={!can || submitting}>{submitting ? "Saving…" : "Continue →"}</PrimaryButton>
      </AuthCard>
    </AuthShell>
  );
}
