"use client";

/**
 * First-login password change — Meridian redesign.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { AuthShell, AuthCard, FieldLabel, inputCls, PrimaryButton } from "@/components/auth/auth-shell";
import { cn } from "@/lib/utils/cn";

function strengthOf(pwd: string): { score: 0 | 1 | 2 | 3 | 4; label: string; tone: "weak" | "okay" | "strong" } {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score: score as 0 | 1, label: "Too weak", tone: "weak" };
  if (score === 2) return { score: 2, label: "Okay", tone: "okay" };
  if (score === 3) return { score: 3, label: "Good", tone: "okay" };
  return { score: 4, label: "Strong", tone: "strong" };
}

export default function ChangePasswordPage() {
  const router = useRouter();
  // Two entry paths are supported:
  //  1. The first-login flow: the user is already signed in (NextAuth session,
  //     flagged requiresPasswordChange) — we POST with the session and the
  //     backend resets the default/temp password. No sessionStorage token.
  //  2. Legacy temp-token flow: a `_first_login_token` in sessionStorage.
  const [token, setToken] = React.useState<string | null>(null);
  const [hasSession, setHasSession] = React.useState<boolean | null>(null);
  const [email, setEmail] = React.useState<string>("");
  const [current, setCurrent] = React.useState("");
  const [pwd, setPwd] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    try {
      setToken(sessionStorage.getItem("_first_login_token"));
      setEmail(sessionStorage.getItem("_first_login_email") ?? "");
    } catch { /* ignore */ }
    // Detect an active NextAuth session (the first-login path).
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((s: { user?: { email?: string } } | null) => {
        if (s?.user) {
          setHasSession(true);
          if (s.user.email) setEmail((prev) => prev || s.user!.email!);
        } else {
          setHasSession(false);
        }
      })
      .catch(() => setHasSession(false));
  }, []);

  const s = strengthOf(pwd);
  const matches = pwd.length > 0 && pwd === confirm;
  // Session path needs the current (default) password; token path does not.
  const ready = hasSession === true || !!token;
  const currentOk = hasSession === true ? current.length > 0 : true;
  const canSubmit = ready && currentOk && s.score >= 2 && matches && !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null); setSubmitting(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      // Legacy token path passes the temp token as a bearer; the session path
      // relies on the NextAuth cookie that requireRequest() reads server-side.
      if (!hasSession && token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers,
        body: JSON.stringify(
          hasSession
            ? { current_password: current, new_password: pwd, confirm_password: confirm }
            : { password: pwd },
        ),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null) as { message?: string } | null;
        throw new Error(data?.message);
      }
      try { sessionStorage.removeItem("_first_login_token"); sessionStorage.removeItem("_first_login_email"); } catch { /* ignore */ }
      setDone(true);
      setTimeout(() => router.push("/auth/login"), 2500);
    } catch (err) {
      setError(
        (err instanceof Error && err.message) ||
          "Couldn't update your password. Check your current password and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Still resolving whether we have a session or a token — show nothing rather
  // than flashing the "sign in again" card.
  if (hasSession === null && token === null) {
    return (
      <AuthShell>
        <AuthCard eyebrow="First sign-in" title="Loading…" subtitle="">
          <span />
        </AuthCard>
      </AuthShell>
    );
  }

  if (!ready) {
    return (
      <AuthShell>
        <AuthCard eyebrow="First sign-in" title="Start by signing in" subtitle="To set a new password we need a fresh sign-in token. Head back to the sign-in page.">
          <Link href="/auth/login" className="inline-flex items-center justify-center w-full h-9 px-4 rounded-md bg-brand text-on-brand font-body text-[13px] font-semibold hover:bg-brand-hover transition-colors duration-fast">
            Go to sign in
          </Link>
        </AuthCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthCard
        eyebrow="First sign-in"
        title={done ? "Password set" : "Set your password"}
        subtitle={done ? "All done. Taking you to the sign-in page so you can use your new password." : `Set the password for ${email}. We'll use it from now on — no more temporary token.`}
      >
        {done ? (
          <div className="rounded-md border border-success-border bg-success-subtle px-4 py-3 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-success-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
            <p className="font-body text-[12.5px] text-success-text">Redirecting…</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <div role="alert" className="rounded-md border border-error-border bg-error-subtle px-3 py-2 flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
                <p className="font-body text-[12.5px] text-error-text flex-1">{error}</p>
              </div>
            )}
            {hasSession && (
              <div>
                <FieldLabel htmlFor="current-pwd">Current password</FieldLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
                  <input id="current-pwd" type={show ? "text" : "password"} autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={cn(inputCls, "pl-9")} placeholder="The password you just signed in with" required />
                </div>
              </div>
            )}
            <div>
              <FieldLabel htmlFor="new-pwd">New password</FieldLabel>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
                <input id="new-pwd" type={show ? "text" : "password"} autoComplete="new-password" value={pwd} onChange={(e) => setPwd(e.target.value)} className={cn(inputCls, "pl-9 pr-10")} required />
                <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded text-text-tertiary hover:text-foreground hover:bg-bg-subtle">
                  {show ? <EyeOff className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> : <Eye className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}
                </button>
              </div>
              {pwd && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-bg-subtle flex gap-0.5 overflow-hidden">
                    {[1, 2, 3, 4].map((i) => (
                      <span key={i} className={cn("h-full flex-1", i <= s.score ? s.tone === "weak" ? "bg-error-text" : s.tone === "okay" ? "bg-warning-text" : "bg-success-text" : "bg-stroke")} />
                    ))}
                  </div>
                  <span className={cn("font-body text-[11px] font-semibold tabular-nums w-14 text-right", s.tone === "weak" ? "text-error-text" : s.tone === "okay" ? "text-warning-text" : "text-success-text")}>{s.label}</span>
                </div>
              )}
            </div>
            <div>
              <FieldLabel htmlFor="confirm-pwd">Confirm new password</FieldLabel>
              <input id="confirm-pwd" type={show ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} required />
              {confirm && !matches && <p className="mt-1 font-body text-[11.5px] text-error-text">Passwords don't match.</p>}
            </div>
            <PrimaryButton type="submit" disabled={!canSubmit} loading={submitting}>Save password</PrimaryButton>
          </form>
        )}
      </AuthCard>
    </AuthShell>
  );
}
