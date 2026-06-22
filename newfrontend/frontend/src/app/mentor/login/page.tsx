"use client";

/**
 * Mentor portal sign-in — portal-scoped login page (mirrors the admin login
 * pattern). Two inline modes, nothing else:
 *   - "signin":  email + password → NextAuth → route into the mentor portal.
 *   - "forgot":  OTP-based reset (email → 6-digit code → new password). No
 *                reset links — the OTP is emailed by the backend.
 *
 * There is intentionally NO registration and NO SSO here: mentors are
 * provisioned by Glimmora (super-admin), so this page exposes only the two
 * actions a provisioned mentor needs — sign in and recover the password.
 *
 * This route renders bare (the mentor layout skips its shell/role-guard for
 * /mentor/login) and is whitelisted as a public path in proxy.ts.
 */

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";
import {
  AuthAlert,
  AuthField,
  AuthSubmitButton,
  authInputCls,
} from "@/components/auth/auth-screen";
import { LoginShell } from "@/app/auth/login/_components/login-layout";
import { AURORA_ACCENT } from "@/app/admin/_shell/aurora";
import { clearClientState } from "@/lib/auth/session-cleanup";
import { cn } from "@/lib/utils/cn";

function safeReturnTo(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  return raw;
}

type Mode = "signin" | "forgot";
type ForgotStep = "email" | "code" | "password" | "done";

/**
 * Submit/action button for the forgot-password steps. Same gradient + sizing as
 * the shared AuthSubmitButton, but takes a per-step `loadingLabel` ("Sending…",
 * "Verifying…", "Saving…") and an optional onClick so the final step can use it
 * as a plain "Back to sign in" action.
 */
function FpButton({
  children,
  disabled,
  loading,
  loadingLabel = "Working…",
  type = "submit",
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  const active = !disabled && !loading;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={!active}
      style={
        active
          ? {
              backgroundImage: AURORA_ACCENT,
              boxShadow: "0 12px 24px -12px rgba(108,76,230,0.6)",
            }
          : undefined
      }
      className={cn(
        "w-full h-11 rounded-lg font-body text-[14px] font-semibold transition-all mt-1",
        active
          ? "text-white hover:opacity-95"
          : "bg-bg-subtle text-text-disabled cursor-not-allowed border border-stroke-subtle",
      )}
    >
      {loading ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span
            className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
            aria-hidden
          />
          {loadingLabel}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export default function MentorLoginPage() {
  return (
    <React.Suspense fallback={<LoginShell><div className="h-40" /></LoginShell>}>
      <MentorLoginScreen />
    </React.Suspense>
  );
}

function MentorLoginScreen() {
  const router = useRouter();
  const sp = useSearchParams();
  const returnTo = safeReturnTo(sp.get("returnTo"));
  const reason = sp.get("reason");

  // Landing here means the user is logged out or their session expired (logout
  // redirects here, and so does the expiry path in proxy.ts / useRoleGuard).
  // Wipe any stale client state so nothing carries across sessions — this also
  // covers the expiry path, where the JS logout helper never ran.
  React.useEffect(() => {
    void clearClientState();
  }, []);

  const [mode, setMode] = React.useState<Mode>("signin");

  return (
    <LoginShell>
      {mode === "signin" ? (
        <SignInForm
          returnTo={returnTo}
          reason={reason}
          onForgot={() => setMode("forgot")}
          router={router}
        />
      ) : (
        <ForgotPasswordForm onBackToSignIn={() => setMode("signin")} />
      )}
    </LoginShell>
  );
}

/* ───────────────────────────── Sign in ─────────────────────────────── */

function SignInForm({
  returnTo,
  reason,
  onForgot,
  router,
}: {
  returnTo: string | null;
  reason: string | null;
  onForgot: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPwd, setShowPwd] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const notice =
    reason === "unauthenticated"
      ? "Your session expired. Sign in again to continue."
      : reason === "portal_mismatch"
      ? "That area isn't part of the mentor portal."
      : null;

  const canSubmit = email.includes("@") && password.length >= 4 && !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);

    const creds = {
      email: email.trim().toLowerCase(),
      password,
      redirect: false as const,
    };

    // Authenticate against the real mentor backend first (NextAuth "credentials"
    // provider → POST /api/v1/auth/login). If the backend is unreachable or the
    // account only lives in the local Prisma DB, fall back to "local-credentials".
    let res = await signIn("credentials", creds);
    if (!res || res.error) {
      res = await signIn("local-credentials", creds);
    }

    if (!res || res.error) {
      setError("That email and password don't match. Try again.");
      setSubmitting(false);
      return;
    }

    // Confirm the signed-in account is actually a mentor.
    const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
    const session = (await sessionRes.json().catch(() => null)) as {
      user?: { role?: string; requiresPasswordChange?: boolean };
    } | null;
    const role = session?.user?.role ?? "";

    if (role !== "mentor" && role !== "admin" && role !== "super_admin") {
      setError("This sign-in is for mentors. Use your role's portal to continue.");
      setSubmitting(false);
      return;
    }

    // Forced first-login password reset (default/temp password → set a new one)
    // before entering the mentor portal — same pattern as enterprise.
    if (session?.user?.requiresPasswordChange) {
      router.push("/mentor/reset-password");
      return;
    }

    let dest = returnTo ?? "/mentor/dashboard";

    // First-run mentors land on onboarding until it's complete.
    if (role === "mentor" && !returnTo) {
      const meRes = await fetch("/api/mentor/me", { cache: "no-store" });
      if (meRes.ok) {
        const me = (await meRes.json()) as { onboardingComplete?: boolean };
        if (!me.onboardingComplete) dest = "/mentor/onboarding";
      }
    }

    router.push(dest);
  }

  return (
    <>
      <header className="mb-6">
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-text-tertiary mb-2">
          Mentor portal
        </p>
        <h1 className="font-display text-[27px] font-bold text-foreground tracking-[-0.03em] leading-none">
          Welcome back
        </h1>
        <p className="mt-2 font-body text-[14px] text-text-secondary">
          Sign in to review submissions and run your mentorships.
        </p>
      </header>

      {notice && !error ? <AuthAlert variant="info">{notice}</AuthAlert> : null}
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <AuthField label="Email" htmlFor="mentor-login-email">
          <input
            id="mentor-login-email"
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
          htmlFor="mentor-login-password"
          labelExtra={
            <button
              type="button"
              onClick={onForgot}
              className="font-body text-[12.5px] font-semibold text-text-link hover:underline underline-offset-2"
            >
              Forgot?
            </button>
          }
        >
          <div className="relative">
            <input
              id="mentor-login-password"
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

        <AuthSubmitButton disabled={!canSubmit} loading={submitting}>
          Sign in
        </AuthSubmitButton>
      </form>

      <p className="mt-6 pt-5 border-t border-stroke-subtle text-center font-body text-[12.5px] text-text-tertiary leading-relaxed">
        Mentor accounts are provisioned by Glimmora. Contact your administrator
        if you need access.
      </p>
    </>
  );
}

/* ────────────────────────── Forgot password (OTP) ──────────────────────── */

function ForgotPasswordForm({ onBackToSignIn }: { onBackToSignIn: () => void }) {
  const [step, setStep] = React.useState<ForgotStep>("email");
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);

  // Send (or resend) the email OTP. `resend` only changes the busy flag + copy.
  async function sendOtp(resend = false): Promise<boolean> {
    if (!email.includes("@")) return false;
    setError(null);
    setInfo(null);
    if (resend) setResending(true);
    else setSubmitting(true);
    try {
      const res = await fetch("/api/auth/otp/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (!res.ok) {
        // 4xx/5xx → sending didn't work.
        setError(
          resend
            ? "Resending the code didn't work. Please try again in a moment."
            : "Sending the code didn't work. Please try again in a moment.",
        );
        return false;
      }
      // Security: never reveal whether the account exists.
      setInfo(
        `If an account exists for ${email.trim().toLowerCase()}, a 6-digit code is on its way. It expires in 5 minutes.`,
      );
      return true;
    } catch {
      setError(
        resend
          ? "Resending the code didn't work. Check your connection and try again."
          : "Sending the code didn't work. Check your connection and try again.",
      );
      return false;
    } finally {
      setSubmitting(false);
      setResending(false);
    }
  }

  async function onSendEmail(e: React.FormEvent) {
    e.preventDefault();
    const ok = await sendOtp(false);
    if (ok) setStep("code");
  }

  async function onResend() {
    await sendOtp(true);
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
        setError("Verifying the code didn't work — it's invalid or expired. Resend a new code.");
        return;
      }
      setStep("password");
      setInfo(null);
    } catch {
      setError("Verifying the code didn't work. Check your connection and try again.");
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
        setError("Setting your new password didn't work. The code may have expired — start again.");
        return;
      }
      setStep("done");
      setError(null);
      setInfo(null);
    } catch {
      setError("Setting your new password didn't work. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function goToSignIn() {
    setStep("email");
    setCode("");
    setPassword("");
    setConfirm("");
    setError(null);
    setInfo(null);
    onBackToSignIn();
  }

  // Step titles: Forgot password → OTP verification → Reset password → Done.
  const titles: Record<ForgotStep, string> = {
    email: "Forgot password",
    code: "OTP verification",
    password: "Reset password",
    done: "Password updated",
  };
  const subtitles: Record<ForgotStep, string> = {
    email: "Enter your email and we'll send a one-time code to reset your password.",
    code: `Enter the 6-digit code sent to ${email}.`,
    password: "Choose a new password for your mentor account.",
    done: "Your password was set. Sign in with your new password to continue.",
  };

  return (
    <>
      <header className="mb-6">
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-text-tertiary mb-2">
          Mentor portal
        </p>
        <h1 className="font-display text-[27px] font-bold text-foreground tracking-[-0.03em] leading-none">
          {titles[step]}
        </h1>
        <p className="mt-2 font-body text-[14px] text-text-secondary">{subtitles[step]}</p>
      </header>

      {error && <AuthAlert variant="error">{error}</AuthAlert>}
      {info && <AuthAlert variant="info">{info}</AuthAlert>}

      {step === "email" && (
        <form onSubmit={onSendEmail} className="space-y-4">
          <AuthField label="Email" htmlFor="mentor-fp-email">
            <input
              id="mentor-fp-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@email.com"
              className={authInputCls}
              required
            />
          </AuthField>
          <FpButton disabled={!email.includes("@")} loading={submitting} loadingLabel="Sending…">
            Send code
          </FpButton>
          <button
            type="button"
            onClick={onBackToSignIn}
            className="inline-flex items-center gap-1.5 font-body text-[13px] font-semibold text-text-link hover:underline underline-offset-2 mt-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Back to sign in
          </button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={verifyOtp} className="space-y-4">
          <AuthField label="Verification code" htmlFor="mentor-fp-code">
            <input
              id="mentor-fp-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              className={authInputCls}
              required
            />
          </AuthField>
          <FpButton disabled={code.trim().length < 4} loading={submitting} loadingLabel="Verifying…">
            Verify code
          </FpButton>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onResend}
              disabled={resending || submitting}
              className="font-body text-[13px] font-medium text-brand-emphasis hover:underline underline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {resending ? "Resending…" : "Resend code"}
            </button>
            <button
              type="button"
              onClick={onBackToSignIn}
              className="font-body text-[13px] font-semibold text-text-link hover:underline underline-offset-2"
            >
              Back to sign in
            </button>
          </div>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={setNewPassword} className="space-y-4">
          <AuthField label="New password" htmlFor="mentor-fp-pw">
            <input
              id="mentor-fp-pw"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className={authInputCls}
              required
            />
          </AuthField>
          <AuthField label="Confirm password" htmlFor="mentor-fp-pw2">
            <input
              id="mentor-fp-pw2"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              className={authInputCls}
              required
            />
          </AuthField>
          <FpButton
            disabled={password.length < 8 || password !== confirm}
            loading={submitting}
            loadingLabel="Saving…"
          >
            Set new password
          </FpButton>
        </form>
      )}

      {step === "done" && (
        <div className="space-y-4">
          <AuthAlert variant="success">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={1.75} aria-hidden />
              <p>Your password was set. Sign in with your new password to continue.</p>
            </div>
          </AuthAlert>
          <FpButton type="button" onClick={goToSignIn}>
            Back to sign in
          </FpButton>
        </div>
      )}
    </>
  );
}
