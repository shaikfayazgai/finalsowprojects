"use client";

/**
 * First-login password setup (provisioned accounts: enterprise / mentor /
 * admin / student get emailed credentials with no password set). On their first
 * login attempt the backend emails a 6-digit OTP and returns
 * `needs_password_setup`; this page verifies the OTP and sets the password via
 * /api/auth/otp?action=reset (→ backend /password/setup-after-otp).
 *
 * Themed to match the home/portal palette. Reuses the same OTP UX as the
 * forgot-password flow.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { apiCall, ApiError } from "@/lib/api/client";
import { PORTALS, type PortalKey } from "@/lib/auth/portal-access";

export function PortalSetupPasswordScreen({ portal }: { portal: PortalKey }) {
  const def = PORTALS[portal];
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[440px] flex-col justify-between overflow-hidden p-10 text-white lg:flex
                      bg-[linear-gradient(150deg,#3a2a1a_0%,#6b4a22_45%,#a47b2e_100%)]">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold-400/20 blur-3xl" />
        <Link href="/" className="relative inline-flex w-fit items-center rounded-lg bg-white/15 px-3 py-2 ring-1 ring-white/20 hover:bg-white/25">
          <div className="relative h-8 w-32"><Image src="/logo.png" alt="GlimmoraTeam" fill className="object-contain object-left" /></div>
        </Link>
        <div className="relative space-y-4">
          <span className="inline-block rounded-full bg-gold-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold-100 ring-1 ring-gold-300/30">{def.name}</span>
          <h2 className="font-heading text-3xl font-bold leading-tight">Set up your password</h2>
          <p className="text-base leading-relaxed text-white/75">Your account was created for you. Verify your email with the code we sent and choose a password.</p>
        </div>
        <p className="relative text-sm text-white/40">&copy; 2026 GlimmoraTeam. All rights reserved.</p>
      </div>
      <div className="flex flex-1 items-center justify-center bg-beige-50 p-6">
        <div className="w-full max-w-[420px]"><PortalSetupPasswordForm portal={portal} /></div>
      </div>
    </div>
  );
}

export default function PortalSetupPasswordForm({ portal }: { portal: PortalKey }) {
  const def = PORTALS[portal];
  const params = useSearchParams();
  const [email, setEmail] = useState(params?.get("email") ?? "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const inputCls = "flex h-11 w-full rounded-lg border border-beige-200 bg-white px-3 text-sm placeholder:text-beige-400 focus:outline-none focus:ring-2 focus:ring-brown-400 disabled:opacity-50";
  const btnCls = "flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold text-white shadow-lg shadow-brown-500/20 bg-[linear-gradient(135deg,#6b4a22_0%,#a47b2e_100%)] hover:brightness-105 disabled:opacity-60";

  const sendCode = async () => {
    if (!email) return;
    setBusy(true); setError(null); setInfo(null);
    try {
      await apiCall(`/api/auth/otp?action=send`, { method: "POST", body: JSON.stringify({ email: email.trim().toLowerCase() }) });
      setInfo("We emailed a 6-digit code. Enter it below with your new password.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send the code.");
    } finally { setBusy(false); }
  };

  // Auto-send the code on mount if the email is prefilled (came from login).
  useEffect(() => { if (params?.get("email")) sendCode(); /* eslint-disable-next-line */ }, []);

  const submit = async (e: React.FormEvent) => {
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
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid or expired code.");
    } finally { setBusy(false); }
  };

  if (done) {
    return (
      <div className="space-y-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-forest-600" />
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-brown-950">Password set</h1>
          <p className="text-sm text-beige-500">You can now sign in.</p>
        </div>
        <Link href={def.loginPath} className={btnCls}>Go to sign in</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-brown-950">Set up your password</h1>
        <p className="text-sm text-beige-500">Verify your email and choose a password to activate your {def.name} account.</p>
      </div>

      {error && <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" /><p className="text-sm text-red-700">{error}</p></div>}
      {info && <div className="rounded-lg border border-forest-200 bg-forest-50 p-3 text-sm text-forest-700">{info}</div>}

      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-brown-900">Email</label>
          <div className="flex gap-2">
            <input type="email" required disabled={busy} value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
            <button type="button" onClick={sendCode} disabled={busy || !email} className="shrink-0 rounded-lg bg-brown-100 px-3 text-sm font-medium text-brown-800 hover:bg-brown-200 disabled:opacity-50">Send code</button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-brown-900">6-digit code</label>
          <input inputMode="numeric" maxLength={6} required disabled={busy} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className={cn(inputCls, "text-center font-mono text-lg tracking-[0.5em]")} placeholder="••••••" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-brown-900">New password</label>
          <input type="password" required disabled={busy} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} placeholder="At least 8 characters" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-brown-900">Confirm password</label>
          <input type="password" required disabled={busy} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} placeholder="Re-enter password" />
        </div>
        <button type="submit" disabled={busy} className={btnCls}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set password & continue"}</button>
        <p className="text-center text-sm text-beige-500"><Link href={def.loginPath} className="text-brown-700 hover:underline">Back to sign in</Link></p>
      </form>
    </div>
  );
}
