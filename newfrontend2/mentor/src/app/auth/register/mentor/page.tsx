"use client";

/**
 * Mentor self-register — two-step UX (Option 2).
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Lock,
  Mail,
  User as UserIcon,
  AlertCircle,
  KeyRound,
  ArrowLeft,
  Eye,
  EyeOff,
  ChevronRight,
} from "lucide-react";
import { AuthShell, AuthCard, FieldLabel, inputCls, PrimaryButton } from "@/components/auth/auth-shell";
import { cn } from "@/lib/utils/cn";

function strengthOf(pwd: string): { score: 0 | 1 | 2 | 3 | 4; label: string; tone: "weak" | "okay" | "strong" } {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score: score as 0 | 1, label: "Too weak", tone: "weak" };
  if (score === 2) return { score: 2, label: "Okay", tone: "okay" };
  if (score === 3) return { score: 3, label: "Good", tone: "okay" };
  return { score: 4, label: "Strong", tone: "strong" };
}

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-text-tertiary text-center mb-1">
      Step {step} of 2 · {step === 1 ? "Accept invitation" : "Create password"}
    </p>
  );
}

export default function MentorRegisterPage() {
  return (
    <React.Suspense fallback={null}>
      <Inner />
    </React.Suspense>
  );
}

function Inner() {
  const router = useRouter();
  const sp = useSearchParams();

  const [step, setStep] = React.useState<1 | 2>(1);
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [inviteCode, setInviteCode] = React.useState(sp.get("code") ?? "");
  const [orgLabel, setOrgLabel] = React.useState<string | null>(null);

  const [pwd, setPwd] = React.useState("");
  const [confirmPwd, setConfirmPwd] = React.useState("");
  const [showPwd, setShowPwd] = React.useState(false);

  const [validating, setValidating] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const strength = strengthOf(pwd);
  const passwordsMatch = pwd.length > 0 && pwd === confirmPwd;
  const canContinueStep1 =
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 1 &&
    email.includes("@") &&
    inviteCode.trim().length >= 4 &&
    !validating;
  const canSubmitStep2 = strength.score >= 2 && passwordsMatch && !submitting;

  async function onContinueStep1(e: React.FormEvent) {
    e.preventDefault();
    if (!canContinueStep1) return;
    setError(null);
    setValidating(true);
    try {
      const res = await fetch("/api/mentors/invites/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: inviteCode.trim(),
          email: email.trim().toLowerCase(),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { message?: string; orgLabel?: string };
      if (!res.ok) {
        throw new Error(body.message ?? "Could not verify your invitation.");
      }
      setOrgLabel(body.orgLabel ?? null);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setValidating(false);
    }
  }

  async function onSubmitPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmitStep2) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password: pwd,
          inviteCode: inviteCode.trim(),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? "Couldn't create your mentor account.");
      }
      const signed = await signIn("local-credentials", {
        email: email.trim().toLowerCase(),
        password: pwd,
        redirect: false,
      });
      if (signed && !signed.error) {
        router.push("/mentor/onboarding");
      } else {
        router.push("/auth/login?registered=mentor&role=mentor");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 1) {
    return (
      <AuthShell>
        <AuthCard
          eyebrow="Mentor access"
          title="Accept your invitation"
          subtitle="Confirm the details from your invite email. On the next step you'll create your password."
          footer={
            <Link
              href="/auth/login?role=mentor"
              className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-brand-emphasis hover:underline underline-offset-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Already have an account? Sign in
            </Link>
          }
        >
          <StepIndicator step={1} />
          <form onSubmit={onContinueStep1} className="space-y-3">
            {error && (
              <div role="alert" className="rounded-md border border-error-border bg-error-subtle px-3 py-2 flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
                <p className="font-body text-[12.5px] text-error-text flex-1">{error}</p>
              </div>
            )}
            <div>
              <FieldLabel htmlFor="invite">Invite code</FieldLabel>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
                <input
                  id="invite"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className={cn(inputCls, "pl-9 font-mono tabular-nums")}
                  placeholder="ABCD-1234"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel htmlFor="first">First name</FieldLabel>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
                  <input
                    id="first"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={cn(inputCls, "pl-9")}
                    autoComplete="given-name"
                    required
                  />
                </div>
              </div>
              <div>
                <FieldLabel htmlFor="last">Last name</FieldLabel>
                <input
                  id="last"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputCls}
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>
            <div>
              <FieldLabel htmlFor="email">Work email</FieldLabel>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(inputCls, "pl-9")}
                  autoComplete="email"
                  required
                />
              </div>
              <p className="mt-1.5 font-body text-[11.5px] text-text-tertiary">
                Must match the address your program manager invited.
              </p>
            </div>
            <PrimaryButton type="submit" disabled={!canContinueStep1} loading={validating}>
              <span className="inline-flex items-center justify-center gap-1.5">
                Continue
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              </span>
            </PrimaryButton>
          </form>
        </AuthCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthCard
        eyebrow="Mentor access"
        title="Create your password"
        subtitle={
          orgLabel
            ? `Last step for ${email} · ${orgLabel}. Choose a password you'll use to sign in.`
            : `Last step for ${email}. Choose a password you'll use to sign in.`
        }
        footer={
          <button
            type="button"
            onClick={() => {
              setStep(1);
              setPwd("");
              setConfirmPwd("");
              setError(null);
            }}
            className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-brand-emphasis hover:underline underline-offset-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Back to invitation details
          </button>
        }
      >
        <StepIndicator step={2} />
        <form onSubmit={onSubmitPassword} className="space-y-3">
          {error && (
            <div role="alert" className="rounded-md border border-error-border bg-error-subtle px-3 py-2 flex items-start gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
              <p className="font-body text-[12.5px] text-error-text flex-1">{error}</p>
            </div>
          )}
          <div>
            <FieldLabel htmlFor="pwd">Password</FieldLabel>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
              <input
                id="pwd"
                type={showPwd ? "text" : "password"}
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                className={cn(inputCls, "pl-9 pr-10")}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? "Hide password" : "Show password"}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded text-text-tertiary hover:text-foreground hover:bg-bg-subtle"
              >
                {showPwd ? <EyeOff className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> : <Eye className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}
              </button>
            </div>
            {pwd && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full bg-bg-subtle flex gap-0.5 overflow-hidden">
                  {[1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-full flex-1",
                        i <= strength.score
                          ? strength.tone === "weak"
                            ? "bg-error-text"
                            : strength.tone === "okay"
                              ? "bg-warning-text"
                              : "bg-success-text"
                          : "bg-stroke",
                      )}
                    />
                  ))}
                </div>
                <span
                  className={cn(
                    "font-body text-[11px] font-semibold tabular-nums w-14 text-right",
                    strength.tone === "weak"
                      ? "text-error-text"
                      : strength.tone === "okay"
                        ? "text-warning-text"
                        : "text-success-text",
                  )}
                >
                  {strength.label}
                </span>
              </div>
            )}
          </div>
          <div>
            <FieldLabel htmlFor="confirm-pwd">Confirm password</FieldLabel>
            <input
              id="confirm-pwd"
              type={showPwd ? "text" : "password"}
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              className={inputCls}
              autoComplete="new-password"
              required
            />
            {confirmPwd && !passwordsMatch && (
              <p className="mt-1 font-body text-[11.5px] text-error-text">Passwords don&apos;t match.</p>
            )}
          </div>
          <PrimaryButton type="submit" disabled={!canSubmitStep2} loading={submitting}>
            Create account & sign in
          </PrimaryButton>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
