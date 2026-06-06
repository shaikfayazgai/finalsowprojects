"use client";

/**
 * Per-portal OTP password reset (no reset links).
 *
 * Stage 1 (request): enter email → POST /api/auth/otp?action=send → 6-digit
 *   code emailed (5-min expiry). Always succeeds (no account enumeration).
 * Stage 2 (verify): enter code + new password → POST /api/auth/otp?action=reset
 *   → verifies OTP and sets the new password atomically. On success, route to
 *   the portal's login.
 *
 * Themed to match the home page / portal logins (brown/gold/beige).
 */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { apiCall, ApiError } from "@/lib/api/client";
import { PORTALS, type PortalKey } from "@/lib/auth/portal-access";

export function PortalForgotPasswordScreen({ portal }: { portal: PortalKey }) {
  const def = PORTALS[portal];
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[440px] flex-col justify-between overflow-hidden p-10 text-white lg:flex
                      bg-[linear-gradient(150deg,#3a2a1a_0%,#6b4a22_45%,#a47b2e_100%)]">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold-400/20 blur-3xl" />
        <Link href="/" className="relative inline-flex w-fit items-center rounded-lg bg-white/15 px-3 py-2 ring-1 ring-white/20 transition-colors hover:bg-white/25">
          <div className="relative h-8 w-32"><Image src="/logo.png" alt="GlimmoraTeam" fill className="object-contain object-left" /></div>
        </Link>
        <div className="relative space-y-4">
          <span className="inline-block rounded-full bg-gold-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold-100 ring-1 ring-gold-300/30">{def.name}</span>
          <h2 className="font-heading text-3xl font-bold leading-tight">Reset your password</h2>
          <p className="text-base leading-relaxed text-white/75">We&apos;ll email you a one-time code — no links to click.</p>
        </div>
        <p className="relative text-sm text-white/40">&copy; 2026 GlimmoraTeam. All rights reserved.</p>
      </div>
      <div className="flex flex-1 items-center justify-center bg-beige-50 p-6">
        <div className="w-full max-w-[420px]"><PortalForgotPasswordForm portal={portal} /></div>
      </div>
    </div>
  );
}

export default function PortalForgotPasswordForm({ portal }: { portal: PortalKey }) {
  const def = PORTALS[portal];
  const [stage, setStage] = useState<"request" | "verify" | "done">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const inputCls = cn(
    "flex h-11 w-full rounded-lg border border-beige-200 bg-white px-3 text-sm transition-colors",
    "placeholder:text-beige-400 hover:border-beige-400",
    "focus:outline-none focus:ring-2 focus:ring-brown-400 focus:ring-offset-1 disabled:opacity-50",
  );
  const btnCls = cn(
    "flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold text-white shadow-lg shadow-brown-500/20 transition-all",
    "bg-[linear-gradient(135deg,#6b4a22_0%,#a47b2e_100%)] hover:shadow-brown-500/40 hover:brightness-105 disabled:opacity-60",
  );

  const sendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setBusy(true); setError(null); setInfo(null);
    try {
      await apiCall(`/api/auth/otp?action=send`, {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), loginUrl: def.loginPath }),
      });
      setInfo("If an account exists, a 6-digit code has been emailed. It expires in 5 minutes.");
      setStage("verify");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send the code. Try again.");
    } finally { setBusy(false); }
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) return setError("Password must be at least 8 characters.");
    if (newPassword !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    try {
      await apiCall(`/api/auth/otp?action=reset`, {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim(), newPassword }),
      });
      setStage("done");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid or expired code.");
    } finally { setBusy(false); }
  };

  if (stage === "done") {
    return (
      <div className="space-y-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-forest-600" />
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-brown-950">Password updated</h1>
          <p className="text-sm text-beige-500">You can now sign in with your new password.</p>
        </div>
        <Link href={def.loginPath} className={btnCls}>Go to sign in</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link href={def.loginPath} className="inline-flex items-center gap-1 text-sm text-brown-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to sign in
      </Link>

      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-brown-950">
          {stage === "request" ? "Forgot password" : "Enter your code"}
        </h1>
        <p className="text-sm text-beige-500">
          {stage === "request"
            ? `Enter the email for your ${def.name} account.`
            : "We emailed a 6-digit code. Enter it with your new password."}
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {info && (
        <div className="rounded-lg border border-forest-200 bg-forest-50 p-3 text-sm text-forest-700">{info}</div>
      )}

      {stage === "request" ? (
        <form onSubmit={sendOtp} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-brown-900">Email</label>
            <input id="email" type="email" required disabled={busy} value={email}
              onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
          </div>
          <button type="submit" disabled={busy} className={btnCls}>
            {busy ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</>) : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={reset} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium text-brown-900">6-digit code</label>
            <input id="code" inputMode="numeric" maxLength={6} required disabled={busy} value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className={cn(inputCls, "tracking-[0.5em] text-center font-mono text-lg")} placeholder="••••••" />
          </div>
          <div className="space-y-2">
            <label htmlFor="np" className="text-sm font-medium text-brown-900">New password</label>
            <input id="np" type="password" required disabled={busy} value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} className={inputCls} placeholder="At least 8 characters" />
          </div>
          <div className="space-y-2">
            <label htmlFor="cp" className="text-sm font-medium text-brown-900">Confirm password</label>
            <input id="cp" type="password" required disabled={busy} value={confirm}
              onChange={(e) => setConfirm(e.target.value)} className={inputCls} placeholder="Re-enter password" />
          </div>
          <button type="submit" disabled={busy} className={btnCls}>
            {busy ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating…</>) : "Update password"}
          </button>
          <button type="button" onClick={() => sendOtp()} disabled={busy}
            className="w-full text-center text-sm text-brown-600 hover:underline">
            Didn&apos;t get a code? Resend
          </button>
        </form>
      )}
    </div>
  );
}
