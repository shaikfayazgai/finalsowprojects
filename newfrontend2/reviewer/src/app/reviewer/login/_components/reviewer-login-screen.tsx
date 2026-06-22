"use client";

/**
 * Reviewer sign-in — dedicated reviewer portal entry (like /admin/login).
 *
 * Only two affordances by design:
 *   1. Email + password sign-in.
 *   2. Forgot password (→ /reviewer/forgot-password, OTP-based — no email link).
 *
 * No self-registration and no OAuth here: reviewers are provisioned by an
 * enterprise / platform admin, so the login surface stays intentionally lean.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import {
  AuthAlert,
  AuthField,
  AuthSubmitButton,
  authInputCls,
} from "@/components/auth/auth-screen";
import { LoginShell } from "@/app/auth/login/_components/login-layout";
import { cn } from "@/lib/utils/cn";

const REVIEWER_HOME = "/enterprise/reviewer/queue";

function safeReturnTo(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  return raw;
}

export function ReviewerLoginScreen() {
  const router = useRouter();
  const sp = useSearchParams();
  const returnTo = safeReturnTo(sp.get("returnTo"));
  const reason = sp.get("reason");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPwd, setShowPwd] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notice] = React.useState<string | null>(
    reason === "unauthenticated" ? "Your session expired. Sign in again to continue." : null,
  );
  const [submitting, setSubmitting] = React.useState(false);

  const canSubmit = email.includes("@") && password.length >= 4 && !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);

    const creds = { email: email.trim().toLowerCase(), password, redirect: false } as const;

    // Auth the reviewer against the real backend first (POST /api/v1/auth/login via
    // the "credentials" provider). If the backend is unreachable or the account
    // lives only in the local Prisma DB, fall back to "local-credentials".
    let res = await signIn("credentials", creds);
    if (!res || res.error) {
      res = await signIn("local-credentials", creds);
    }

    if (!res || res.error) {
      // Surface a pending MFA/OTP state (the backend returns these instead of a
      // session) with a clearer hint than a generic credentials failure.
      const validate = await fetch("/api/auth/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: creds.email, password }),
      }).then((r) => (r.ok ? r.json() : null)).catch(() => null) as
        | { status?: string }
        | null;
      const status = validate?.status;
      if (status === "needs_password_setup") {
        setError("Set a password first — use “Forgot?” to receive a one-time code.");
      } else if (status === "mfa_required" || status === "otp_required" || status === "mfa_pending") {
        setError("This account requires an extra verification step that isn't set up here yet.");
      } else {
        setError("That email and password don't match. Try again.");
      }
      setSubmitting(false);
      return;
    }

    // Confirm the session resolved to a reviewer-capable role before routing in.
    const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
    const session = (await sessionRes.json().catch(() => null)) as {
      user?: { role?: string; requiresPasswordChange?: boolean };
    } | null;
    const role = (session?.user?.role ?? "").toLowerCase();
    const reviewerRoles = ["reviewer", "admin", "super_admin", "enterprise"];

    if (!reviewerRoles.includes(role)) {
      setError("This account doesn't have reviewer access. Use the portal that matches your role.");
      setSubmitting(false);
      return;
    }

    // Forced reset: an admin-provisioned reviewer must set a new password before
    // entering the portal. Carry returnTo through so they land where they intended.
    if (session?.user?.requiresPasswordChange) {
      const next = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : "";
      router.push(`/reviewer/change-password${next}`);
      return;
    }

    router.push(returnTo ?? REVIEWER_HOME);
  }

  return (
    <LoginShell>
      <header className="mb-6">
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-emphasis mb-2">
          Reviewer Portal
        </p>
        <h1 className="font-display text-[27px] font-bold text-foreground tracking-[-0.03em] leading-none">
          Sign in to review
        </h1>
        <p className="mt-2 font-body text-[14px] text-text-secondary">
          Access your QA review queue and decisions.
        </p>
      </header>

      {notice && !error ? <AuthAlert variant="info">{notice}</AuthAlert> : null}
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <AuthField label="Email" htmlFor="reviewer-login-email">
          <input
            id="reviewer-login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@email.com"
            className={authInputCls}
            required
            aria-required="true"
          />
        </AuthField>

        <AuthField
          label="Password"
          htmlFor="reviewer-login-password"
          labelExtra={
            <Link
              href="/reviewer/forgot-password"
              className="font-body text-[12.5px] font-semibold text-text-link hover:underline underline-offset-2"
            >
              Forgot?
            </Link>
          }
        >
          <div className="relative">
            <input
              id="reviewer-login-password"
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className={cn(authInputCls, "pr-10")}
              required
              aria-required="true"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              aria-label={showPwd ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-foreground transition-colors"
            >
              {showPwd ? (
                <EyeOff className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              )}
            </button>
          </div>
        </AuthField>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-stroke-subtle accent-brand shrink-0"
          />
          <span className="font-body text-[13px] text-text-secondary">Remember me</span>
        </label>

        <AuthSubmitButton disabled={!canSubmit} loading={submitting} loadingLabel="Signing in…">
          Sign in
        </AuthSubmitButton>
      </form>

      <p className="mt-6 pt-5 border-t border-stroke-subtle text-center font-body text-[12.5px] text-text-tertiary">
        Reviewer access is provisioned by your enterprise admin.
      </p>
    </LoginShell>
  );
}
