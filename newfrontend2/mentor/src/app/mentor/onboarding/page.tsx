"use client";

/**
 * Mentor onboarding — 3-step wizard on the auth split layout (white form panel).
 *
 * Lands after self-register at /auth/register/mentor.
 * Steps: Consent → Competency → Availability → Done.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, Clock, ShieldCheck, Sparkles } from "lucide-react";
import {
  AuthShell,
  AuthCard,
  FieldLabel,
  PrimaryButton,
  SecondaryButton,
  inputCls,
} from "@/components/auth/auth-shell";
import { AuthBrandMark } from "@/components/auth/auth-split-layout";
import { completeMentorOnboarding } from "@/lib/api/mentor";
import { cn } from "@/lib/utils/cn";
import {
  MentorOnboardingProgress,
  type MentorOnboardingStep,
} from "@/app/mentor/onboarding/_components/mentor-onboarding-progress";

type Step = "consent" | "competency" | "availability" | "done";
const FLOW: Step[] = ["consent", "competency", "availability", "done"];

const PROGRESS_STEPS: MentorOnboardingStep[] = [
  { id: "consent", label: "Agreements" },
  { id: "competency", label: "Competency" },
  { id: "availability", label: "Availability" },
  { id: "done", label: "Done" },
];

const STEP_COPY: Record<
  Step,
  { eyebrow: string; title: string; subtitle: string }
> = {
  consent: {
    eyebrow: "Mentor onboarding",
    title: "Mentor agreements",
    subtitle:
      "Confirm the three commitments below before your first review. You can revisit these in Settings → Privacy.",
  },
  competency: {
    eyebrow: "Mentor onboarding",
    title: "Your competency",
    subtitle:
      "Skills and levels assigned during your invite. Matching uses this to route reviews to you.",
  },
  availability: {
    eyebrow: "Mentor onboarding",
    title: "Initial availability",
    subtitle:
      "Set weekly hours and timezone. Update any time from Settings → Availability.",
  },
  done: {
    eyebrow: "Mentor onboarding",
    title: "You're ready",
    subtitle:
      "Your profile is set. Open your dashboard to see pending reviews and mentorship sessions.",
  },
};

const COMPETENCY_ROWS = [
  { role: "engineer", skill: "React", levels: "L1–L4" },
  { role: "engineer", skill: "TypeScript", levels: "L1–L3" },
  { role: "engineer", skill: "Next.js", levels: "L1–L4" },
  { role: "designer", skill: "Figma", levels: "L1–L2" },
  { role: "designer", skill: "Accessibility", levels: "L2–L4" },
];

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
];

export default function MentorOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>("consent");
  const [finishing, setFinishing] = React.useState(false);

  const [acceptTerms, setAcceptTerms] = React.useState(false);
  const [acceptCode, setAcceptCode] = React.useState(false);
  const [acceptConfidentiality, setAcceptConfidentiality] = React.useState(false);
  const [competencyConfirmed, setCompetencyConfirmed] = React.useState(false);
  const [weeklyHours, setWeeklyHours] = React.useState(8);
  const [timezone, setTimezone] = React.useState("Asia/Kolkata");

  const stepIndex = FLOW.indexOf(step);
  const copy = STEP_COPY[step];
  const canConsent = acceptTerms && acceptCode && acceptConfidentiality;

  const canContinue =
    (step === "consent" && canConsent) ||
    (step === "competency" && competencyConfirmed) ||
    step === "availability";

  function next() {
    const i = FLOW.indexOf(step);
    if (step === "availability") {
      setFinishing(true);
      completeMentorOnboarding()
        .catch(() => {})
        .finally(() => {
          setFinishing(false);
          setStep("done");
        });
      return;
    }
    if (i < FLOW.length - 1) setStep(FLOW[i + 1] as Step);
  }

  function back() {
    const i = FLOW.indexOf(step);
    if (i > 0) setStep(FLOW[i - 1] as Step);
  }

  return (
    <AuthShell>
      <AuthBrandMark />
      <AuthCard
        eyebrow={copy.eyebrow}
        title={copy.title}
        subtitle={copy.subtitle}
        footer={
          step === "done" ? (
            <p className="font-body text-[12.5px] text-text-secondary text-center">
              Questions?{" "}
              <a
                href="mailto:mpm@glimmora.team"
                className="font-semibold text-brand-emphasis hover:underline underline-offset-2"
              >
                mpm@glimmora.team
              </a>
            </p>
          ) : undefined
        }
      >
        {step !== "done" && (
          <MentorOnboardingProgress steps={PROGRESS_STEPS} currentIndex={stepIndex} />
        )}

        {step === "consent" && (
          <ConsentPanel
            acceptTerms={acceptTerms}
            setAcceptTerms={setAcceptTerms}
            acceptCode={acceptCode}
            setAcceptCode={setAcceptCode}
            acceptConfidentiality={acceptConfidentiality}
            setAcceptConfidentiality={setAcceptConfidentiality}
          />
        )}

        {step === "competency" && (
          <CompetencyPanel
            confirmed={competencyConfirmed}
            onChange={setCompetencyConfirmed}
          />
        )}

        {step === "availability" && (
          <AvailabilityPanel
            weeklyHours={weeklyHours}
            setWeeklyHours={setWeeklyHours}
            timezone={timezone}
            setTimezone={setTimezone}
          />
        )}

        {step === "done" && <DonePanel />}

        {step !== "done" ? (
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            {step !== "consent" ? (
              <SecondaryButton onClick={back}>Back</SecondaryButton>
            ) : (
              <span className="hidden sm:block" aria-hidden />
            )}
            <PrimaryButton
              onClick={next}
              disabled={!canContinue}
              loading={step === "availability" && finishing}
            >
              {step === "availability" ? "Finish setup" : "Continue"}
            </PrimaryButton>
          </div>
        ) : (
          <PrimaryButton onClick={() => router.push("/mentor/dashboard")}>
            Open mentor dashboard
          </PrimaryButton>
        )}
      </AuthCard>

      {step === "done" && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-text-tertiary">
          <span className="inline-flex items-center gap-1.5 font-body text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} aria-hidden />
            Agreements on file
          </span>
          <span className="text-text-disabled" aria-hidden>
            ·
          </span>
          <span className="inline-flex items-center gap-1.5 font-body text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} aria-hidden />
            Competency confirmed
          </span>
        </div>
      )}
    </AuthShell>
  );
}

function ConsentPanel({
  acceptTerms,
  setAcceptTerms,
  acceptCode,
  setAcceptCode,
  acceptConfidentiality,
  setAcceptConfidentiality,
}: {
  acceptTerms: boolean;
  setAcceptTerms: (v: boolean) => void;
  acceptCode: boolean;
  setAcceptCode: (v: boolean) => void;
  acceptConfidentiality: boolean;
  setAcceptConfidentiality: (v: boolean) => void;
}) {
  return (
    <div className="rounded-lg border border-stroke bg-surface shadow-xs">
      <div className="px-4 py-3 border-b border-stroke-subtle flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-brand-emphasis" strokeWidth={2} aria-hidden />
        <h2 className="font-body text-[12.5px] font-semibold text-foreground">
          Required before first review
        </h2>
      </div>
      <ul className="px-4 py-3 space-y-3">
        <AgreementItem
          checked={acceptTerms}
          onChange={setAcceptTerms}
          title="Terms of mentor engagement"
          body="I agree to provide reviews and mentorship in line with GlimmoraTeam mentor standards: timely, evidence-based, and constructive."
        />
        <AgreementItem
          checked={acceptCode}
          onChange={setAcceptCode}
          title="Code of conduct"
          body="I will treat every contributor with respect — no discriminatory language, harassment, or off-platform demands."
        />
        <AgreementItem
          checked={acceptConfidentiality}
          onChange={setAcceptConfidentiality}
          title="Confidentiality"
          body="Submissions and contributor identities stay confidential to the platform — never shared outside GlimmoraTeam systems."
        />
      </ul>
    </div>
  );
}

function AgreementItem({
  checked,
  onChange,
  title,
  body,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  body: string;
}) {
  return (
    <li>
      <label className="flex gap-3 cursor-pointer items-start">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-3.5 w-3.5 rounded border-stroke text-brand focus:ring-brand accent-brand"
        />
        <div className="flex-1">
          <p className="font-body text-[12.5px] font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 font-body text-[11.5px] text-text-secondary leading-relaxed">
            {body}
          </p>
        </div>
      </label>
    </li>
  );
}

function CompetencyPanel({
  confirmed,
  onChange,
}: {
  confirmed: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-stroke bg-surface shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-stroke-subtle flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-emphasis" strokeWidth={2} aria-hidden />
          <h2 className="font-body text-[12.5px] font-semibold text-foreground">
            Assigned competency matrix
          </h2>
        </div>
        <div className="grid grid-cols-[1fr_1.4fr_1fr] gap-3 px-4 py-2.5 bg-bg-subtle/50 border-b border-stroke-subtle font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
          <span>Role</span>
          <span>Skill</span>
          <span>Levels</span>
        </div>
        <ul>
          {COMPETENCY_ROWS.map((c, i) => (
            <li
              key={i}
              className="grid grid-cols-[1fr_1.4fr_1fr] gap-3 px-4 py-2.5 border-b border-stroke-subtle last:border-0 font-body text-[12.5px] text-foreground"
            >
              <span className="capitalize">{c.role}</span>
              <span>{c.skill}</span>
              <span className="font-mono text-[11.5px] tabular-nums text-text-secondary">
                {c.levels}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="font-body text-[11.5px] text-text-tertiary leading-relaxed">
        Something looks off? Contact{" "}
        <a
          href="mailto:mpm@glimmora.team"
          className="font-semibold text-brand-emphasis hover:underline underline-offset-2"
        >
          mpm@glimmora.team
        </a>{" "}
        before continuing.
      </p>

      <label className="flex gap-3 cursor-pointer items-start rounded-lg border border-stroke bg-surface px-4 py-3 shadow-xs">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-3.5 w-3.5 rounded border-stroke text-brand focus:ring-brand accent-brand"
        />
        <span className="font-body text-[12.5px] text-foreground">
          This competency matrix is accurate.
        </span>
      </label>
    </div>
  );
}

function AvailabilityPanel({
  weeklyHours,
  setWeeklyHours,
  timezone,
  setTimezone,
}: {
  weeklyHours: number;
  setWeeklyHours: (v: number) => void;
  timezone: string;
  setTimezone: (v: string) => void;
}) {
  return (
    <div className="rounded-lg border border-stroke bg-surface shadow-xs">
      <div className="px-4 py-3 border-b border-stroke-subtle flex items-center gap-2">
        <Clock className="h-4 w-4 text-brand-emphasis" strokeWidth={2} aria-hidden />
        <h2 className="font-body text-[12.5px] font-semibold text-foreground">
          Review capacity
        </h2>
      </div>
      <div className="px-4 py-4 space-y-5">
        <div>
          <FieldLabel>Weekly hours for reviews</FieldLabel>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="range"
              min={2}
              max={30}
              step={1}
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(Number(e.target.value))}
              className="flex-1 h-1.5 rounded-full bg-bg-subtle accent-brand"
              aria-label="Weekly hours"
            />
            <span className="font-display text-[22px] font-semibold tabular-nums text-foreground w-14 text-right shrink-0">
              {weeklyHours}h
            </span>
          </div>
          <p className="mt-1.5 font-body text-[11.5px] text-text-tertiary">
            Used for queue depth and matching fairness.
          </p>
        </div>

        <div>
          <FieldLabel htmlFor="mentor-tz">Timezone</FieldLabel>
          <select
            id="mentor-tz"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className={cn(inputCls, "mt-1.5")}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function DonePanel() {
  return (
    <div className="rounded-lg border border-stroke bg-surface shadow-xs px-6 py-8 text-center space-y-4">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-success-subtle text-success-text mx-auto">
        <Check className="h-7 w-7" strokeWidth={2.5} aria-hidden />
      </div>
      <p className="font-body text-[13px] text-text-secondary leading-relaxed max-w-[32ch] mx-auto">
        Competency confirmed and availability saved. New reviews will appear in your queue when
        contributors submit work in your pools.
      </p>
      <p className="inline-flex items-center gap-1.5 font-body text-[11.5px] font-semibold text-success-text">
        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        Onboarding complete
      </p>
    </div>
  );
}
