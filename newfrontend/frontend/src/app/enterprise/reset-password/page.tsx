"use client";

/**
 * Enterprise forced first-login password reset.
 *
 * Reached when a freshly-provisioned account (default password from the
 * super-admin) signs in: the backend flags it `must_change_password`, surfaced
 * as `session.user.requiresPasswordChange`. The enterprise layout bounces every
 * route here until the user sets a new password.
 *
 * Flow:
 *   1. User (already authenticated) sets a new password + confirm.
 *   2. POST /api/enterprise/auth/change-password → backend clears the flag.
 *   3. Re-authenticate with the new password so the fresh session no longer
 *      carries requiresPasswordChange → route to the dashboard.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { clearClientSession } from "@/lib/auth/clear-client-session";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import {
  AuthAlert,
  AuthField,
  AuthSubmitButton,
  authInputCls,
} from "@/components/auth/auth-screen";
import { LoginShell } from "@/app/auth/login/_components/login-layout";
import { cn } from "@/lib/utils/cn";

function strengthOf(pwd: string): { score: number; label: string; tone: "weak" | "okay" | "strong" } {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score, label: "Too weak", tone: "weak" };
  if (score === 2) return { score, label: "Okay", tone: "okay" };
  if (score === 3) return { score, label: "Good", tone: "okay" };
  return { score, label: "Strong", tone: "strong" };
}

export default function EnterpriseResetPasswordPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const email = session?.user?.email ?? "";

  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPwd, setShowPwd] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const s = strengthOf(password);
  const matches = password.length > 0 && password === confirm;
  const canSubmit = s.score >= 2 && matches && !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);

    try {
      // 1. Set the new password on the backend (clears must_change_password).
      const res = await fetch("/api/enterprise/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_password: password,
          confirmPassword: confirm,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? "Couldn't update your password. Please try again.");
        setSubmitting(false);
        return;
      }

      // 2. Re-authenticate so the new session no longer carries
      //    requiresPasswordChange (the backend now returns false). Use the
      //    backend-backed "credentials" provider (same store as login).
      if (email) {
        const signInRes = await signIn("credentials", {
          email: email.trim().toLowerCase(),
          password,
          redirect: false,
        });
        if (signInRes && !signInRes.error) {
          // Full navigation (not router.replace) so the new session cookie is
          // applied cleanly on the dashboard load without an extra refresh.
          window.location.assign("/enterprise/dashboard");
          return;
        }
      }

      // Fallback: password changed but silent re-login didn't take — send them
      // to sign in again with the new password.
      router.replace("/enterprise/login?reason=password_changed");
    } catch {
      setError("Couldn't update your password. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <LoginShell>
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-subtle px-3 py-1 mb-3">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-emphasis" strokeWidth={2.2} aria-hidden />
          <span className="font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-emphasis">
            First sign-in
          </span>
        </div>
        <h1 className="font-display text-[27px] font-bold text-foreground tracking-[-0.03em] leading-none">
          Set your password
        </h1>
        <p className="mt-2 font-body text-[14px] text-text-secondary">
          For security, choose a new password before continuing
          {email ? <> — signed in as <span className="font-semibold text-foreground">{email}</span></> : null}.
        </p>
      </header>

      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <AuthField label="New password" htmlFor="ent-reset-pw">
          <div className="relative">
            <input
              id="ent-reset-pw"
              type={showPwd ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className={cn(authInputCls, "pr-10")}
              required
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
          {password.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-bg-subtle overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    s.tone === "weak" && "bg-error-text",
                    s.tone === "okay" && "bg-warning-text",
                    s.tone === "strong" && "bg-success-text",
                  )}
                  style={{ width: `${(s.score / 4) * 100}%` }}
                />
              </div>
              <span className="font-body text-[12px] text-text-tertiary">{s.label}</span>
            </div>
          )}
        </AuthField>

        <AuthField label="Confirm password" htmlFor="ent-reset-pw2">
          <input
            id="ent-reset-pw2"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter password"
            className={authInputCls}
            required
          />
          {confirm.length > 0 && !matches && (
            <p className="mt-1.5 font-body text-[12px] text-error-text">Passwords don&apos;t match.</p>
          )}
        </AuthField>

        <AuthSubmitButton disabled={!canSubmit} loading={submitting}>
          Set password &amp; continue
        </AuthSubmitButton>
      </form>

      <p className="mt-6 pt-5 border-t border-stroke-subtle text-center font-body text-[13px] text-text-secondary">
        <button
          type="button"
          onClick={() => {
            clearClientSession();
            void signOut({ callbackUrl: "/enterprise/login" });
          }}
          className="font-semibold text-text-link hover:underline underline-offset-2"
        >
          Back to sign in
        </button>
      </p>
    </LoginShell>
  );
}
