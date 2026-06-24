"use client";

/**
 * Contributor (freelancer) sign-up — OTP-based, no activation links.
 * Step 1: name + email  → emails a 6-digit code.
 * Step 2: enter the code → verifies the email.
 * Step 3: create a password → creates the account + signs in, landing on the
 *         profile-completion page (the locked shell).
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import {
  AuthAlert,
  AuthField,
  AuthSubmitButton,
  authInputCls,
} from "@/components/auth/auth-screen";
import {
  LoginDivider,
  LoginOAuthRow,
  LoginShell,
} from "@/app/auth/login/_components/login-layout";
import { cn } from "@/lib/utils/cn";

type Step = "details" | "otp" | "password";

async function postJson(url: string, body: unknown): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, data };
}

export function ContributorRegisterScreen() {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>("details");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [agreed, setAgreed] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [devOtp, setDevOtp] = React.useState<string | null>(null);
  const [pwd, setPwd] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPwd, setShowPwd] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [oauthBusy, setOauthBusy] = React.useState<"google" | "microsoft" | null>(null);

  const emailLc = email.trim().toLowerCase();
  const strong = pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /\d/.test(pwd);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !emailLc.includes("@") || !agreed) return;
    setError(null); setNotice(null); setBusy(true);
    try {
      const { ok, data } = await postJson("/api/auth/otp/send-email", { email: emailLc });
      if (!ok) throw new Error((data.detail as string) ?? "Couldn't send the code. Try again.");
      setDevOtp((data.devOtp as string) ?? null);
      setNotice(`We emailed a 6-digit code to ${emailLc}.`);
      setStep("otp");
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong."); }
    finally { setBusy(false); }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length < 4) return;
    setError(null); setBusy(true);
    try {
      const { ok, data } = await postJson("/api/auth/otp/verify-email", { email: emailLc, code: code.trim() });
      if (!ok) throw new Error((data.detail as string) ?? "Invalid or expired code.");
      setNotice("Email verified. Set a password to finish.");
      setStep("password");
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong."); }
    finally { setBusy(false); }
  }

  async function resend() {
    setError(null); setBusy(true);
    try {
      const { ok, data } = await postJson("/api/auth/otp/send-email", { email: emailLc });
      if (!ok) throw new Error((data.detail as string) ?? "Couldn't resend the code.");
      setDevOtp((data.devOtp as string) ?? null);
      setNotice("A new code is on its way.");
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong."); }
    finally { setBusy(false); }
  }

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!strong) { setError("Use 8+ characters with upper + lowercase letters and a number."); return; }
    if (pwd !== confirm) { setError("Passwords don't match."); return; }
    setError(null); setBusy(true);
    try {
      const { ok, status, data } = await postJson("/api/auth/register", {
        firstName: firstName.trim(), lastName: lastName.trim(), email: emailLc, password: pwd, track: "freelancer",
      });
      if (!ok) {
        throw new Error(status === 409
          ? "An account with this email already exists — sign in instead."
          : ((data.detail as string) ?? "Couldn't create your account."));
      }
      // Email already verified above — sign in and land on the locked profile shell.
      let res = await signIn("credentials", { email: emailLc, password: pwd, redirect: false });
      if (!res || res.error) res = await signIn("local-credentials", { email: emailLc, password: pwd, redirect: false });
      router.push("/contributor/profile/complete");
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong."); }
    finally { setBusy(false); }
  }

  /**
   * Sign up with Google / Microsoft. Set the `sso_register_role` cookie first so
   * the NextAuth signIn callback (src/auth.ts) lets a brand-new email through
   * instead of blocking it as "not registered" — the contributor account is
   * created from the OAuth identity on callback.
   */
  async function onOauth(provider: "google" | "microsoft") {
    setError(null);
    setOauthBusy(provider);
    document.cookie = "sso_register_role=contributor; path=/; max-age=600; samesite=lax";
    const idp = provider === "google" ? "google" : "microsoft-entra-id";
    await signIn(idp, { callbackUrl: "/contributor/profile/complete" });
    setOauthBusy(null);
  }

  return (
    <LoginShell>
      <header className="mb-6">
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-emphasis mb-2">
          Contributor Portal
        </p>
        <h1 className="font-display text-[27px] font-bold text-foreground tracking-[-0.03em] leading-tight">
          Create account
        </h1>
        <p className="mt-2 font-body text-[14px] text-text-secondary">
          {step === "details" && "Sign up with email — we'll send you a verification code."}
          {step === "otp" && "Enter the 6-digit code we emailed you."}
          {step === "password" && "Set a password to finish creating your account."}
        </p>
      </header>

      {notice && !error ? <AuthAlert variant="info">{notice}</AuthAlert> : null}
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
      {devOtp ? (
        <p className="mb-3 rounded-lg border border-stroke-subtle bg-surface-hover px-3 py-2 font-body text-[12px] text-text-secondary">
          Dev code (no inbox configured): <span className="font-mono font-semibold text-foreground">{devOtp}</span>
        </p>
      ) : null}

      {step === "details" ? (
        <form onSubmit={sendCode} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <AuthField label="First name" htmlFor="reg-first">
              <input id="reg-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={authInputCls} placeholder="Anita" required />
            </AuthField>
            <AuthField label="Last name" htmlFor="reg-last">
              <input id="reg-last" value={lastName} onChange={(e) => setLastName(e.target.value)} className={authInputCls} placeholder="Ramesh" required />
            </AuthField>
          </div>
          <AuthField label="Email" htmlFor="reg-email">
            <input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={authInputCls} placeholder="name@email.com" required />
          </AuthField>
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-3.5 w-3.5 rounded border-stroke-subtle accent-brand shrink-0" />
            <span className="font-body text-[12px] text-text-secondary leading-relaxed">
              I agree to the{" "}
              <Link href="/legal/terms" className="text-brand-emphasis hover:underline">Terms</Link> and{" "}
              <Link href="/legal/privacy" className="text-brand-emphasis hover:underline">Privacy Policy</Link>.
            </span>
          </label>
          <AuthSubmitButton disabled={!firstName.trim() || !lastName.trim() || !emailLc.includes("@") || !agreed || busy} loading={busy} loadingLabel="Sending code…">
            Send verification code
          </AuthSubmitButton>
        </form>
      ) : null}

      {step === "details" ? (
        <>
          <LoginDivider />
          <LoginOAuthRow
            onGoogle={() => onOauth("google")}
            onMicrosoft={() => onOauth("microsoft")}
            googleBusy={oauthBusy === "google"}
            microsoftBusy={oauthBusy === "microsoft"}
            disabled={busy}
          />
        </>
      ) : null}

      {step === "otp" ? (
        <form onSubmit={verifyCode} className="space-y-4">
          <AuthField label="Verification code" htmlFor="reg-otp">
            <input id="reg-otp" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className={cn(authInputCls, "tracking-[0.5em] text-center font-mono text-[18px]")} placeholder="••••••" required />
          </AuthField>
          <AuthSubmitButton disabled={code.trim().length < 4 || busy} loading={busy} loadingLabel="Verifying…">
            Verify email
          </AuthSubmitButton>
          <div className="flex items-center justify-between font-body text-[12.5px]">
            <button type="button" onClick={() => setStep("details")} className="text-text-tertiary hover:text-foreground">← Change email</button>
            <button type="button" onClick={resend} disabled={busy} className="font-semibold text-text-link hover:underline disabled:opacity-50">Resend code</button>
          </div>
        </form>
      ) : null}

      {step === "password" ? (
        <form onSubmit={createAccount} className="space-y-4">
          <AuthField label="Create password" htmlFor="reg-pwd">
            <div className="relative">
              <input id="reg-pwd" type={showPwd ? "text" : "password"} value={pwd} onChange={(e) => setPwd(e.target.value)} className={cn(authInputCls, "pr-10")} placeholder="8+ chars, mixed case, number" required />
              <button type="button" onClick={() => setShowPwd((v) => !v)} aria-label={showPwd ? "Hide" : "Show"} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-foreground">
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {pwd && !strong ? <p className="mt-1.5 font-body text-[11.5px] text-warning-text">Use 8+ characters with upper + lowercase letters and a number.</p> : null}
          </AuthField>
          <AuthField label="Confirm password" htmlFor="reg-confirm">
            <input id="reg-confirm" type={showPwd ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={authInputCls} placeholder="Re-enter password" required />
          </AuthField>
          <AuthSubmitButton disabled={!strong || pwd !== confirm || busy} loading={busy} loadingLabel="Creating account…">
            Create account
          </AuthSubmitButton>
        </form>
      ) : null}

      <p className="mt-6 text-center font-body text-[13px] text-text-secondary">
        Already have an account?{" "}
        <Link href="/contributor/login" className="font-semibold text-text-link hover:underline underline-offset-2">Sign in</Link>
      </p>
      <p className="mt-1.5 text-center font-body text-[12.5px] text-text-tertiary">
        <Link href="/auth/forgot-password" className="font-semibold text-text-link hover:underline underline-offset-2">Forgot password?</Link>
      </p>
    </LoginShell>
  );
}
