"use client";

/**
 * Contributor sign-in — dedicated contributor portal entry.
 *
 * Authenticates against the real backend first (POST /api/v1/auth/login via the
 * "credentials" provider, so the session carries a backend access token the
 * portal's API proxies need), falling back to "local-credentials" only if the
 * backend is unreachable. Mirrors the reviewer/admin login pattern.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { accountExistsForEmail } from "@/lib/api/auth";
import { cn } from "@/lib/utils/cn";

const CONTRIBUTOR_HOME = "/contributor/dashboard";
const CONTRIBUTOR_REGISTER = "/contributor/register";
const CONTRIBUTOR_ROLES = ["contributor", "freelancer", "student", "women", "admin", "super_admin"];

function registerHref(email: string): string {
  const e = email.trim().toLowerCase();
  return e.includes("@") ? `${CONTRIBUTOR_REGISTER}?email=${encodeURIComponent(e)}` : CONTRIBUTOR_REGISTER;
}

function safeReturnTo(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  return raw;
}

export function ContributorLoginScreen() {
  const router = useRouter();
  const sp = useSearchParams();
  const returnTo = safeReturnTo(sp.get("returnTo"));
  const reason = sp.get("reason");
  const authError = sp.get("error");
  const ssoEmail = sp.get("email") ?? "";

  // SSO sign-in with an email that has no Glimmora account → the NextAuth signIn
  // callback bounced back here with ?error=SsoNotRegistered. Rather than a
  // dead-end error, send them straight into sign-up (email prefilled).
  React.useEffect(() => {
    if (authError === "SsoNotRegistered") {
      router.replace(registerHref(ssoEmail));
    }
  }, [authError, ssoEmail, router]);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPwd, setShowPwd] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notice] = React.useState<string | null>(
    reason === "unauthenticated" ? "Your session expired. Sign in again to continue." : null,
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [oauthBusy, setOauthBusy] = React.useState<"google" | "microsoft" | null>(null);

  const canSubmit = email.includes("@") && password.length >= 4 && !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);

    const creds = { email: email.trim().toLowerCase(), password, redirect: false } as const;

    let res = await signIn("credentials", creds);
    if (!res || res.error) {
      res = await signIn("local-credentials", creds);
    }

    if (!res || res.error) {
      // The backend returns the SAME generic 401 for "no account" and "wrong
      // password" (anti-enumeration), so the sign-in result alone can't tell
      // them apart. Probe the dedicated existence endpoint: only when the
      // account genuinely does NOT exist do we send the user to sign up. A
      // wrong password for an EXISTING account keeps the invalid-credentials
      // error (and never redirects).
      const exists = await accountExistsForEmail(creds.email);
      if (exists === false) {
        router.push(registerHref(creds.email));
        return;
      }
      setError("That email and password don't match. Try again.");
      setSubmitting(false);
      return;
    }

    const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
    const session = (await sessionRes.json().catch(() => null)) as {
      user?: { role?: string; requiresPasswordChange?: boolean };
    } | null;
    const role = (session?.user?.role ?? "").toLowerCase();

    if (!CONTRIBUTOR_ROLES.includes(role)) {
      setError("This account doesn't have contributor access. Use the portal that matches your role.");
      setSubmitting(false);
      return;
    }

    router.push(returnTo ?? CONTRIBUTOR_HOME);
  }

  /**
   * Sign IN with Google / Microsoft (existing contributor). Unlike sign-up, no
   * `sso_register_role` cookie is set — this is an existing account. After the
   * OAuth callback NextAuth lands the user on their contributor destination;
   * proxy.ts routes by role from there.
   */
  async function onOauth(provider: "google" | "microsoft") {
    setError(null);
    setOauthBusy(provider);
    const idp = provider === "google" ? "google" : "microsoft-entra-id";
    await signIn(idp, { callbackUrl: returnTo ?? CONTRIBUTOR_HOME });
    setOauthBusy(null);
  }

  return (
    <LoginShell>
      <header className="mb-6">
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-emphasis mb-2">
          Contributor Portal
        </p>
        <h1 className="font-display text-[27px] font-bold text-foreground tracking-[-0.03em] leading-none">
          Sign in to your work
        </h1>
        <p className="mt-2 font-body text-[14px] text-text-secondary">
          Access your assigned tasks, submissions and earnings.
        </p>
      </header>

      {notice && !error ? <AuthAlert variant="info">{notice}</AuthAlert> : null}
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <AuthField label="Email" htmlFor="contributor-login-email">
          <input
            id="contributor-login-email"
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
          htmlFor="contributor-login-password"
          labelExtra={
            <Link
              href="/auth/forgot-password"
              className="font-body text-[12.5px] font-semibold text-text-link hover:underline underline-offset-2"
            >
              Forgot?
            </Link>
          }
        >
          <div className="relative">
            <input
              id="contributor-login-password"
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
              {showPwd ? <EyeOff className="h-4 w-4" strokeWidth={1.75} aria-hidden /> : <Eye className="h-4 w-4" strokeWidth={1.75} aria-hidden />}
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

        <AuthSubmitButton disabled={!canSubmit} loading={submitting} loadingLabel="Signing in…">
          Sign in
        </AuthSubmitButton>
      </form>

      <LoginDivider />
      <LoginOAuthRow
        onGoogle={() => onOauth("google")}
        onMicrosoft={() => onOauth("microsoft")}
        googleBusy={oauthBusy === "google"}
        microsoftBusy={oauthBusy === "microsoft"}
        disabled={submitting}
      />

      {/* Contributor is the only role with open self-signup (a freelancer). */}
      <p className="mt-6 text-center font-body text-[13px] text-text-secondary">
        New to Glimmora?{" "}
        <Link
          href={registerHref(email)}
          className="font-semibold text-text-link hover:underline underline-offset-2"
        >
          Create account
        </Link>
      </p>
    </LoginShell>
  );
}
