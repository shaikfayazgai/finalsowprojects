"use client";

/**
 * Email verification gate for manual (credentials) signups. Until the user
 * verifies their email with the 6-digit OTP, the dashboard is blocked. After
 * verification they continue to profile completion → dashboard. SSO users skip
 * this (they're already verified by Google/Microsoft).
 */

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, AlertCircle, CheckCircle2, MailCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { apiCall, ApiError } from "@/lib/api/client";

export default function VerifyEmailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const email = session?.user?.email ?? "";
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const sendCode = useCallback(async () => {
    if (!email) return;
    setSending(true); setError(null);
    try {
      await apiCall("/api/auth/otp?action=send", { method: "POST", body: JSON.stringify({ email }) });
      setInfo("We emailed a 6-digit verification code. Enter it below.");
    } catch {
      setError("Couldn't send the code. Try again.");
    } finally { setSending(false); }
  }, [email]);

  // Auto-send a code on first load.
  useEffect(() => { if (email) void sendCode(); }, [email, sendCode]);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await apiCall("/api/auth/otp?action=verify", {
        method: "POST",
        body: JSON.stringify({ email, code: code.trim() }),
      });
      setDone(true);
      // Email is now verified server-side; the session flag is stale, so sign
      // out + back in refreshes it, then the profile gate routes them onward.
      setTimeout(() => { void signOut({ callbackUrl: "/contributor/login" }); }, 1800);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid or expired code.");
    } finally { setBusy(false); }
  };

  const inputCls = "flex h-11 w-full rounded-lg border border-beige-200 bg-white px-3 text-center font-mono text-lg tracking-[0.5em] placeholder:text-beige-400 focus:outline-none focus:ring-2 focus:ring-brown-400";
  const btnCls = "flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold text-white shadow-lg shadow-brown-500/20 bg-[linear-gradient(135deg,#6b4a22_0%,#a47b2e_100%)] hover:brightness-105 disabled:opacity-60";

  return (
    <div className="flex min-h-screen items-center justify-center bg-beige-50 p-6">
      <div className="w-full max-w-[420px] space-y-8">
        <Link href="/" className="inline-flex">
          <div className="relative h-9 w-36"><Image src="/logo.png" alt="GlimmoraTeam" fill className="object-contain object-left" /></div>
        </Link>

        {done ? (
          <div className="space-y-5 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-forest-600" />
            <h1 className="text-2xl font-semibold text-brown-950">Email verified</h1>
            <p className="text-sm text-beige-500">Sign in again to continue to your profile setup.</p>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <MailCheck className="h-8 w-8 text-gold-600" />
              <h1 className="text-2xl font-semibold tracking-tight text-brown-950">Verify your email</h1>
              <p className="text-sm text-beige-500">
                Enter the 6-digit code we sent to <span className="font-medium text-brown-800">{email || "your email"}</span>.
                You&apos;ll set up your profile next.
              </p>
            </div>

            {error && <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" /><p className="text-sm text-red-700">{error}</p></div>}
            {info && <div className="rounded-lg border border-forest-200 bg-forest-50 p-3 text-sm text-forest-700">{info}</div>}

            <form onSubmit={verify} className="space-y-5">
              <input inputMode="numeric" maxLength={6} required disabled={busy} value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className={inputCls} placeholder="••••••" />
              <button type="submit" disabled={busy || code.length !== 6} className={btnCls}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & continue"}
              </button>
              <button type="button" onClick={sendCode} disabled={sending}
                className="w-full text-center text-sm text-brown-600 hover:underline disabled:opacity-60">
                {sending ? "Sending…" : "Resend code"}
              </button>
            </form>

            <button onClick={() => signOut({ callbackUrl: "/" })} className={cn("w-full text-center text-xs text-beige-400 hover:underline")}>
              Sign out
            </button>
          </>
        )}
      </div>
    </div>
  );
}
