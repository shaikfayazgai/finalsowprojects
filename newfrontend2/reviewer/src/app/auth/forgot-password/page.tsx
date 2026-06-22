"use client";

/**
 * Forgot password — OTP-based reset (no email reset-link).
 * Step 1 (email):    enter email → backend emails a 6-digit OTP
 * Step 2 (code):     enter the 6-digit OTP (verified against the backend)
 * Step 3 (password): set a new password (POST /password/setup-after-otp) → done
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

type Step = "email" | "code" | "password" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = React.useState<Step>("email");
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);

  async function sendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    if (!email.includes("@")) return;
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/otp/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (!res.ok && res.status >= 500) throw new Error("server");
      setStep("code");
      setInfo(`We've emailed a 6-digit code to ${email}. It expires in a few minutes.`);
    } catch {
      setError("Couldn't send the code right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length < 4) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/otp/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim() }),
      });
      const body = (await res.json().catch(() => ({}))) as { verified?: boolean };
      if (!res.ok || !body.verified) {
        setError("That code is invalid or expired. Check your email or resend.");
        return;
      }
      setStep("password");
      setInfo(null);
    } catch {
      setError("Couldn't verify the code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function setNewPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
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
          new_password: password,
        }),
      });
      if (!res.ok) {
        setError("Couldn't set your new password. The code may have expired — start again.");
        return;
      }
      setStep("done");
    } catch {
      setError("Couldn't set your new password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const titles: Record<Step, string> = {
    email: "Reset password",
    code: "Enter your code",
    password: "Set a new password",
    done: "Password updated",
  };
  const subtitles: Record<Step, string> = {
    email: "Enter your email and we'll send a one-time code to reset your password.",
    code: `Enter the 6-digit code we sent to ${email}.`,
    password: "Choose a new password for your account.",
    done: "You can now sign in with your new password.",
  };

  return (
    <AuthScreen
      title={titles[step]}
      subtitle={subtitles[step]}
      footer={
        step === "done" ? undefined : (
          <>
            Remember your password? <AuthHeaderLink href="/auth/login">Sign in</AuthHeaderLink>
          </>
        )
      }
    >
      {error && <AuthAlert variant="error">{error}</AuthAlert>}
      {info && <AuthAlert variant="info">{info}</AuthAlert>}

      {step === "email" && (
        <form onSubmit={sendOtp} className="space-y-4">
          <AuthField label="Email" htmlFor="fp-email">
            <input
              id="fp-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@email.com"
              className={authInputCls}
              required
            />
          </AuthField>
          <AuthSubmitButton disabled={!email.includes("@")} loading={submitting}>
            Send code
          </AuthSubmitButton>
          <AuthBackLink href="/auth/login">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Back to sign in
          </AuthBackLink>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={verifyOtp} className="space-y-4">
          <AuthField label="Verification code" htmlFor="fp-code">
            <input
              id="fp-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              className={authInputCls}
              required
            />
          </AuthField>
          <AuthSubmitButton disabled={code.trim().length < 4} loading={submitting}>
            Verify code
          </AuthSubmitButton>
          <button
            type="button"
            onClick={() => sendOtp()}
            className="font-body text-[13px] font-medium text-brand-emphasis hover:underline underline-offset-2"
          >
            Resend code
          </button>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={setNewPassword} className="space-y-4">
          <AuthField label="New password" htmlFor="fp-pw">
            <input
              id="fp-pw"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className={authInputCls}
              required
            />
          </AuthField>
          <AuthField label="Confirm password" htmlFor="fp-pw2">
            <input
              id="fp-pw2"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              className={authInputCls}
              required
            />
          </AuthField>
          <AuthSubmitButton disabled={password.length < 8 || password !== confirm} loading={submitting}>
            Set new password
          </AuthSubmitButton>
        </form>
      )}

      {step === "done" && (
        <div className="space-y-3">
          <AuthAlert variant="success">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={1.75} aria-hidden />
              <p>Your password has been updated. Sign in to continue.</p>
            </div>
          </AuthAlert>
          <AuthBackLink href="/auth/login">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Go to sign in
          </AuthBackLink>
        </div>
      )}
    </AuthScreen>
  );
}
