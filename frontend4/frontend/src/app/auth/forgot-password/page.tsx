"use client";

/**
 * Forgot password — OTP flow (split-screen auth layout).
 *
 * Per the GTPROJECT auth model, password recovery for EVERY role is an email
 * OTP code (not a reset link). Three steps on one screen:
 *   1. Enter email          → POST /api/auth/otp/send-email
 *   2. Enter the 6-digit code + a new password
 *                           → POST /api/auth/password/setup-after-otp
 *                              (backend re-verifies the OTP, then sets the pw)
 *   3. Done                 → back to sign in
 *
 * The UI components/theme are unchanged from the prior link-based page.
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

type Step = "email" | "code" | "done";

function pwStrengthOk(pwd: string): boolean {
  // Mirror the change-password rule: ≥8 chars and at least 2 character classes.
  let classes = 0;
  if (/[a-z]/.test(pwd)) classes++;
  if (/[A-Z]/.test(pwd)) classes++;
  if (/\d/.test(pwd)) classes++;
  if (/[^A-Za-z0-9]/.test(pwd)) classes++;
  return pwd.length >= 8 && classes >= 2;
}

export default function ForgotPasswordPage() {
  const [step, setStep] = React.useState<Step>("email");
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [pwd, setPwd] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [devOtp, setDevOtp] = React.useState<string | null>(null);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (!email.includes("@")) return;
    setError(null);
    setDevOtp(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/otp/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        devOtp?: string;
        message?: string;
      };
      if (!res.ok) throw new Error(body.message);
      // Local/dev convenience: the backend echoes the code when SMTP/Redis
      // aren't available — surface it so the cycle is testable.
      if (body.devOtp) setDevOtp(body.devOtp);
      setStep("code");
    } catch (err) {
      setError(
        (err instanceof Error && err.message) ||
          "Couldn't send the code right now. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length < 4) {
      setError("Enter the code from your email.");
      return;
    }
    if (!pwStrengthOk(pwd)) {
      setError("Use at least 8 characters with a mix of letters, numbers, or symbols.");
      return;
    }
    if (pwd !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/password/setup-after-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim(),
          new_password: pwd,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { detail?: string; message?: string };
      if (!res.ok) throw new Error(body.detail ?? body.message);
      setStep("done");
    } catch (err) {
      setError(
        (err instanceof Error && err.message) ||
          "Couldn't reset your password. The code may have expired — request a new one.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title={
        step === "done"
          ? "Password updated"
          : step === "code"
            ? "Enter your code"
            : "Reset password"
      }
      subtitle={
        step === "done"
          ? "You can now sign in with your new password."
          : step === "code"
            ? `We sent a 6-digit code to ${email}. Enter it below with your new password.`
            : "Enter your email and we'll send a one-time code to reset your password."
      }
      footer={
        step === "done" ? undefined : (
          <>
            Remember your password? <AuthHeaderLink href="/auth/login">Sign in</AuthHeaderLink>
          </>
        )
      }
    >
      {step === "done" ? (
        <div className="space-y-2">
          <AuthAlert variant="success">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={1.75} aria-hidden />
              <p>Your password has been reset.</p>
            </div>
          </AuthAlert>
          <AuthBackLink href="/auth/login">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Back to sign in
          </AuthBackLink>
        </div>
      ) : step === "code" ? (
        <form onSubmit={resetPassword} className="space-y-4">
          {error && <AuthAlert variant="error">{error}</AuthAlert>}
          {devOtp && (
            <AuthAlert variant="info">
              Dev code (email/SMS not configured): <strong>{devOtp}</strong>
            </AuthAlert>
          )}

          <AuthField label="Verification code" htmlFor="otp-code">
            <input
              id="otp-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="6-digit code"
              className={authInputCls}
              required
              aria-required="true"
            />
          </AuthField>

          <AuthField label="New password" htmlFor="new-pwd">
            <input
              id="new-pwd"
              type="password"
              autoComplete="new-password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="At least 8 characters"
              className={authInputCls}
              required
              aria-required="true"
            />
          </AuthField>

          <AuthField label="Confirm new password" htmlFor="confirm-pwd">
            <input
              id="confirm-pwd"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              className={authInputCls}
              required
              aria-required="true"
            />
          </AuthField>

          <AuthSubmitButton disabled={submitting} loading={submitting}>
            Reset password
          </AuthSubmitButton>

          <button
            type="button"
            onClick={() => sendCode()}
            disabled={submitting}
            className="w-full text-center font-body text-[12.5px] text-brand-emphasis hover:underline underline-offset-2 disabled:opacity-50"
          >
            Resend code
          </button>

          <AuthBackLink href="/auth/login">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Back to sign in
          </AuthBackLink>
        </form>
      ) : (
        <form onSubmit={sendCode} className="space-y-4">
          {error && <AuthAlert variant="error">{error}</AuthAlert>}

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
            Send code
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
