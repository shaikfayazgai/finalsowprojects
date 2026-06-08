"use client";

/**
 * Reset password — Meridian redesign.
 * Reads token from query, sets new password, posts to API.
 */

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { AuthShell, AuthCard, FieldLabel, inputCls, PrimaryButton } from "@/components/auth/auth-shell";
import { cn } from "@/lib/utils/cn";

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={null}>
      <Inner />
    </React.Suspense>
  );
}

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

function Inner() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token") ?? "";
  const [pwd, setPwd] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const s = strengthOf(pwd);
  const matches = pwd.length > 0 && pwd === confirm;
  const canSubmit = !!token && s.score >= 2 && matches && !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: pwd }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(body.message ?? "Couldn't reset your password. The link may have expired.");
      }
      setDone(true);
      setTimeout(() => router.push("/auth/login"), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <AuthShell>
        <AuthCard eyebrow="Account recovery" title="This link is invalid" subtitle="The password-reset link is missing its token. Request a new one and try again.">
          <Link href="/auth/forgot-password" className="inline-flex items-center justify-center w-full h-9 px-4 rounded-md bg-brand text-on-brand font-body text-[13px] font-semibold hover:bg-brand-hover transition-colors duration-fast">
            Request a new reset link
          </Link>
        </AuthCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthCard
        eyebrow="Account recovery"
        title={done ? "Password updated" : "Set a new password"}
        subtitle={done ? "You can now sign in with your new password. Taking you to the sign-in page…" : "Pick something strong. We'll sign you out of all other sessions for safety."}
        footer={!done && (
          <Link href="/auth/login" className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-brand-emphasis hover:underline underline-offset-2">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Back to sign in
          </Link>
        )}
      >
        {done ? (
          <div className="rounded-md border border-success-border bg-success-subtle px-4 py-3 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-success-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
            <p className="font-body text-[12.5px] text-success-text">You'll be redirected automatically.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <div role="alert" className="rounded-md border border-error-border bg-error-subtle px-3 py-2 flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
                <p className="font-body text-[12.5px] text-error-text flex-1">{error}</p>
              </div>
            )}
            <div>
              <FieldLabel htmlFor="new-pwd">New password</FieldLabel>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
                <input id="new-pwd" type={show ? "text" : "password"} autoComplete="new-password" value={pwd} onChange={(e) => setPwd(e.target.value)} className={cn(inputCls, "pl-9 pr-10")} required />
                <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded text-text-tertiary hover:text-foreground hover:bg-bg-subtle">
                  {show ? <EyeOff className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> : <Eye className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}
                </button>
              </div>
              {pwd && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-bg-subtle flex gap-0.5 overflow-hidden">
                    {[1, 2, 3, 4].map((i) => (
                      <span key={i} className={cn("h-full flex-1", i <= s.score ? s.tone === "weak" ? "bg-error-text" : s.tone === "okay" ? "bg-warning-text" : "bg-success-text" : "bg-stroke")} />
                    ))}
                  </div>
                  <span className={cn("font-body text-[11px] font-semibold tabular-nums w-14 text-right", s.tone === "weak" ? "text-error-text" : s.tone === "okay" ? "text-warning-text" : "text-success-text")}>{s.label}</span>
                </div>
              )}
            </div>
            <div>
              <FieldLabel htmlFor="confirm-pwd">Confirm new password</FieldLabel>
              <input id="confirm-pwd" type={show ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} required />
              {confirm && !matches && <p className="mt-1 font-body text-[11.5px] text-error-text">Passwords don't match.</p>}
            </div>
            <PrimaryButton type="submit" disabled={!canSubmit} loading={submitting}>Update password</PrimaryButton>
          </form>
        )}
      </AuthCard>
    </AuthShell>
  );
}
