"use client";

/**
 * MFA setup — Meridian redesign.
 *
 * Reads the bootstrap token from sessionStorage (stashed on /auth/login),
 * fetches a TOTP secret + QR, accepts the 6-digit code, confirms with the
 * backend, then signs in via NextAuth.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ShieldCheck, AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { AuthShell, AuthCard, FieldLabel, inputCls, PrimaryButton, SecondaryButton } from "@/components/auth/auth-shell";

const ROLE_HOME: Record<string, string> = {
  admin: "/admin/dashboard",
  super_admin: "/admin/dashboard",
  enterprise: "/enterprise/dashboard",
  reviewer: "/enterprise/reviewer",
  mentor: "/mentor/dashboard",
  contributor: "/contributor/dashboard",
};

export default function MfaSetupPage() {
  return (
    <React.Suspense fallback={null}>
      <Inner />
    </React.Suspense>
  );
}

function Inner() {
  const router = useRouter();
  const [token, setToken] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");
  const [qrUrl, setQrUrl] = React.useState<string | null>(null);
  const [secret, setSecret] = React.useState<string | null>(null);
  const [code, setCode] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loadingQr, setLoadingQr] = React.useState(true);

  React.useEffect(() => {
    try {
      setToken(sessionStorage.getItem("_mfa_pending_token"));
      setEmail(sessionStorage.getItem("_mfa_setup_email") ?? "");
      setPassword(sessionStorage.getItem("_mfa_setup_password") ?? "");
    } catch { /* ignore */ }
  }, []);

  React.useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoadingQr(true);
      try {
        const res = await fetch("/api/auth/mfa/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const data = await res.json() as { qrUrl: string; secret: string };
        if (cancelled) return;
        setQrUrl(data.qrUrl);
        setSecret(data.secret);
      } catch {
        if (!cancelled) setError("Couldn't generate your MFA secret. Please sign in again.");
      } finally {
        if (!cancelled) setLoadingQr(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  async function onConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6 || !token) return;
    setError(null); setVerifying(true);
    try {
      const res = await fetch("/api/auth/mfa/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) throw new Error();
      const signed = await signIn("credentials", { email, password, redirect: false });
      if (!signed || signed.error) throw new Error();
      try {
        sessionStorage.removeItem("_mfa_setup_email");
        sessionStorage.removeItem("_mfa_setup_password");
        sessionStorage.removeItem("_mfa_pending_token");
      } catch { /* ignore */ }
      const session = await (await fetch("/api/auth/session", { cache: "no-store" })).json();
      const role = (session as { user?: { role?: string } } | null)?.user?.role ?? "contributor";
      router.push(ROLE_HOME[role] ?? "/contributor/dashboard");
    } catch {
      setError("That code didn't match. Generate a fresh one and try again.");
    } finally {
      setVerifying(false);
    }
  }

  if (!token) {
    return (
      <AuthShell>
        <AuthCard eyebrow="Two-factor authentication" title="Sign in first" subtitle="We need a fresh sign-in token to set up MFA. Head back to the sign-in page.">
          <Link href="/auth/login" className="inline-flex items-center justify-center w-full h-9 px-4 rounded-md bg-brand text-on-brand font-body text-[13px] font-semibold hover:bg-brand-hover transition-colors duration-fast">
            Back to sign in
          </Link>
        </AuthCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthCard
        eyebrow="Two-factor authentication"
        title="Set up your authenticator"
        subtitle="Scan with Google Authenticator, Authy, 1Password, or any TOTP app — then enter the 6-digit code to confirm."
        footer={
          <Link href="/auth/login" className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-brand-emphasis hover:underline underline-offset-2">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Back to sign in
          </Link>
        }
      >
        <div className="rounded-lg border border-stroke bg-surface shadow-xs p-4 space-y-4">
          <div className="flex items-center gap-3">
            {loadingQr ? (
              <div aria-label="Loading QR code" className="h-32 w-32 rounded-md bg-bg-subtle animate-pulse shrink-0" />
            ) : qrUrl ? (
              <img src={qrUrl} alt="Two-factor authentication QR code" className="h-32 w-32 rounded-md border border-stroke shrink-0" />
            ) : (
              <div className="h-32 w-32 rounded-md bg-bg-subtle inline-flex items-center justify-center shrink-0">
                <ShieldCheck className="h-6 w-6 text-text-tertiary" strokeWidth={2} aria-hidden />
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-1.5">
              <p className="font-body text-[12.5px] font-semibold text-foreground">Or enter manually</p>
              <code className="block font-mono text-[11.5px] text-text-secondary break-all">{secret ?? "loading…"}</code>
              <button type="button" onClick={async () => { if (secret) try { await navigator.clipboard.writeText(secret); } catch { /* ignore */ } }} className="font-body text-[11.5px] font-semibold text-brand-emphasis hover:underline underline-offset-2">
                Copy secret
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={onConfirm} className="space-y-4">
          {error && (
            <div role="alert" className="rounded-md border border-error-border bg-error-subtle px-3 py-2 flex items-start gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
              <p className="font-body text-[12.5px] text-error-text flex-1">{error}</p>
            </div>
          )}
          <div>
            <FieldLabel htmlFor="code">6-digit verification code</FieldLabel>
            <input
              id="code"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123 456"
              className={`${inputCls} text-center tracking-[0.4em] font-mono text-[16px]`}
              autoFocus
              required
            />
          </div>

          <PrimaryButton type="submit" disabled={code.length !== 6} loading={verifying}>
            Confirm + finish signing in
          </PrimaryButton>

          <SecondaryButton onClick={() => location.reload()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" strokeWidth={2} aria-hidden />
            Regenerate QR code
          </SecondaryButton>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
