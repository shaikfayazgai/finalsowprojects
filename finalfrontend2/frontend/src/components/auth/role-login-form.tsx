"use client";

/**
 * RoleLoginForm — the per-role sign-in form used by each portal's own login page
 * (/admin/login, /enterprise/login, /mentor/login, /reviewer/login,
 * /contributor/login). Written fresh for finalfrontend2's role-based login split.
 *
 * SSO + "Create account" are ONLY enabled for self-signup roles (freelancer /
 * women / student → the contributor login). Credential-only roles (enterprise,
 * mentor, reviewer, super admin) pass showSso={false} allowSignup={false}, so
 * they get email/password + Forgot password only.
 *
 * Sign-in mechanism mirrors the platform's real flow: NextAuth `local-credentials`
 * for email/password, `google` / `microsoft-entra-id` for SSO, and
 * resolvePostLogin() (+ mentor/enterprise refinements) for the post-login route.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import {
  AuthField,
  AuthSubmitButton,
  AuthAlert,
  AuthDivider,
  OAuthButtonRow,
  AuthHeaderLink,
  AuthLegalFooter,
  authInputCls,
} from "@/components/auth/auth-screen";
import { LoginShell } from "@/app/auth/login/_components/login-layout";
import {
  resolvePostLogin,
  resolveEnterprisePostLogin,
} from "@/lib/admin/invite-routes";
import type { MeResponse } from "@/lib/hooks/use-me";
import { cn } from "@/lib/utils/cn";

function safeReturnTo(raw: string | null): string | null {
  if (!raw) return null;
  // only allow same-origin relative paths
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return null;
}

export interface RoleLoginFormProps {
  /** Portal heading, e.g. "Enterprise sign in". */
  title?: string;
  subtitle?: string;
  /** Google/Microsoft SSO — only true for the contributor (freelancer/women/student) login. */
  showSso?: boolean;
  /** "Create account" self-registration link — only true for the contributor login. */
  allowSignup?: boolean;
}

export function RoleLoginForm({
  title = "Welcome back",
  subtitle = "Sign in to your workspace",
  showSso = false,
  allowSignup = false,
}: RoleLoginFormProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const returnTo = safeReturnTo(sp.get("returnTo"));
  const reason = sp.get("reason");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPwd, setShowPwd] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [oauthBusy, setOauthBusy] = React.useState<"google" | "microsoft" | null>(null);

  const notice =
    reason === "unauthenticated" ? "Your session expired. Sign in again to continue." : null;
  const canSubmit = email.includes("@") && password.length >= 4 && !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);

    // Authenticate against the REAL FastAPI backend (via the gateway) — the
    // "credentials" provider. No local-DB / Prisma "local-credentials" fallback.
    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    if (!res || res.error) {
      setError("That email and password don't match. Try again.");
      setSubmitting(false);
      return;
    }

    const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
    const session = (await sessionRes.json().catch(() => null)) as {
      user?: { role?: string; email?: string | null; requiresPasswordChange?: boolean; isFirstLogin?: boolean };
    } | null;
    const role = session?.user?.role ?? "contributor";

    // Forced first-login reset: a provisioned account with a default/temp
    // password must set a new one before reaching any portal.
    if (session?.user?.requiresPasswordChange || session?.user?.isFirstLogin) {
      router.push("/auth/change-password?reason=first-login");
      return;
    }

    let dest = resolvePostLogin({ sessionRole: role, returnTo, hasInvite: false });

    if (role === "mentor" && !returnTo) {
      const meRes = await fetch("/api/mentor/me", { cache: "no-store" });
      if (meRes.ok) {
        const me = (await meRes.json()) as { onboardingComplete?: boolean };
        if (!me.onboardingComplete) dest = "/mentor/onboarding";
      }
    }

    if (role === "enterprise" && !returnTo) {
      const meRes = await fetch("/api/me", { cache: "no-store" });
      if (meRes.ok) {
        const me = (await meRes.json()) as MeResponse;
        dest = resolveEnterprisePostLogin({ me, email: session?.user?.email ?? me.user?.email });
      } else {
        dest = resolveEnterprisePostLogin({
          email: session?.user?.email ?? email.trim().toLowerCase(),
        });
      }
    }

    router.push(dest);
  }

  async function onOauth(provider: "google" | "microsoft") {
    setError(null);
    setOauthBusy(provider);
    const idp = provider === "google" ? "google" : "microsoft-entra-id";
    await signIn(idp, { callbackUrl: returnTo ?? "/" });
    setOauthBusy(null);
  }

  return (
    <LoginShell>
      <header className="text-center mb-6">
        <h1 className="font-display text-[24px] font-semibold text-foreground tracking-[-0.02em]">
          {title}
        </h1>
        <p className="mt-1.5 font-body text-[14px] text-text-secondary">{subtitle}</p>
      </header>

      {notice && !error ? <AuthAlert variant="info">{notice}</AuthAlert> : null}
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <AuthField label="Email" htmlFor="email">
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@email.com"
            className={authInputCls}
          />
        </AuthField>

        <AuthField
          label="Password"
          htmlFor="password"
          labelExtra={
            <Link
              href="/auth/forgot-password"
              className="font-body text-[12.5px] font-medium text-text-link hover:underline underline-offset-2"
            >
              Forgot?
            </Link>
          }
        >
          <div className="relative">
            <input
              id="password"
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className={cn(authInputCls, "pr-10")}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              aria-label={showPwd ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
            >
              {showPwd ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
            </button>
          </div>
        </AuthField>

        <AuthSubmitButton disabled={!canSubmit} loading={submitting}>
          Sign in
        </AuthSubmitButton>
      </form>

      {showSso ? (
        <>
          <AuthDivider label="or" />
          <OAuthButtonRow
            onGoogle={() => onOauth("google")}
            onMicrosoft={() => onOauth("microsoft")}
            googleBusy={oauthBusy === "google"}
            microsoftBusy={oauthBusy === "microsoft"}
            disabled={submitting}
          />
        </>
      ) : null}

      {allowSignup ? (
        <p className="mt-6 pt-5 border-t border-stroke-subtle text-center font-body text-[13px] text-text-secondary">
          No account? <AuthHeaderLink href="/auth/register">Create account</AuthHeaderLink>
        </p>
      ) : (
        // Provisioned roles (no self-signup): can recover access via the OTP
        // reset. (Admins re-issue default credentials from the user management UI.)
        <p className="mt-6 pt-5 border-t border-stroke-subtle text-center font-body text-[13px] text-text-secondary">
          Didn&apos;t get your credentials?{" "}
          <AuthHeaderLink href="/auth/forgot-password">Resend / reset via email</AuthHeaderLink>
        </p>
      )}

      <AuthLegalFooter />
    </LoginShell>
  );
}
