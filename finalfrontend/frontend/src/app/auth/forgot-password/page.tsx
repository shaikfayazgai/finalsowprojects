"use client";

/**
 * Forgot password — split-screen auth layout.
 */

import * as React from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import {
  AuthAlert,
  AuthBackLink,
  AuthField,
  AuthHeaderLink,
  AuthScreen,
  AuthSubmitButton,
  authInputCls,
} from "@/components/auth/auth-screen";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [hint, setHint] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setError(null);
    setHint(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        code?: string;
        message?: string;
        hint?: string;
      };

      if (!res.ok && res.status >= 500) throw new Error("server");

      if (body.success === false && body.code === "SSO_ONLY") {
        setHint(body.message ?? "This account uses organization SSO. Contact your IT administrator.");
        return;
      }

      if (body.success === false && body.code === "NO_PASSWORD") {
        setHint(
          body.message ??
            "This account has no password. Sign in with Google or Microsoft, or add a password in Settings after signing in.",
        );
        return;
      }

      setSent(true);
    } catch {
      setError("Couldn't send the reset email right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title={sent ? "Check your email" : "Reset password"}
      subtitle={
        sent
          ? `If an account exists for ${email}, you'll receive a reset link shortly.`
          : "Enter your work email and we'll send a secure link to set a new password."
      }
      footer={
        sent ? undefined : (
          <>
            Remember your password? <AuthHeaderLink href="/auth/login">Sign in</AuthHeaderLink>
          </>
        )
      }
    >
      {sent ? (
        <div className="space-y-2">
          <AuthAlert variant="success">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={1.75} aria-hidden />
              <div className="space-y-2">
                <p>The reset link is valid for 30 minutes.</p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="font-semibold text-brand-emphasis hover:underline underline-offset-2"
                >
                  Try a different email
                </button>
              </div>
            </div>
          </AuthAlert>
          <AuthBackLink href="/auth/login">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Back to sign in
          </AuthBackLink>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <AuthAlert variant="error">{error}</AuthAlert>}
          {hint && (
            <AuthAlert variant="info">
              {hint}{" "}
              <AuthHeaderLink href="/auth/login">Back to sign in</AuthHeaderLink>
            </AuthAlert>
          )}

          <AuthField label="Email" htmlFor="forgot-email">
            <input
              id="forgot-email"
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

          <AuthSubmitButton disabled={!email.includes("@")} loading={submitting}>
            Send reset link
          </AuthSubmitButton>

          <AuthBackLink href="/auth/login">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Back to sign in
          </AuthBackLink>
        </form>
      )}
    </AuthScreen>
  );
}
