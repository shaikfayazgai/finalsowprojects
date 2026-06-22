"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import {
  AuthAlert,
  AuthField,
  AuthHeaderLink,
  AuthSubmitButton,
  authInputCls,
} from "@/components/auth/auth-screen";
import {
  LoginDivider,
  LoginInviteStrip,
  LoginOAuthRow,
  LoginShell,
} from "@/app/auth/login/_components/login-layout";
import {
  findSpecByJwtRole,
  resolveEnterprisePostLogin,
  resolvePostLogin,
} from "@/lib/admin/invite-routes";
import type { MeResponse } from "@/lib/hooks/use-me";
import { markAdminSignInFromInvite } from "@/lib/stores/admin-provisioning-store";
import { cn } from "@/lib/utils/cn";

function safeReturnTo(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  return raw;
}

function prefersSso(inviteRole: string | null): boolean {
  return inviteRole === "enterprise" || inviteRole === "reviewer";
}

export function LoginScreen() {
  const router = useRouter();
  const sp = useSearchParams();
  const returnTo = safeReturnTo(sp.get("returnTo"));
  const reason = sp.get("reason");
  const inviteToken = sp.get("invite");
  const inviteRole = sp.get("role");
  const inviteSpec = findSpecByJwtRole(inviteRole);
  const ssoFirst = prefersSso(inviteRole);

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
  const hasInvite = Boolean(inviteSpec && (inviteToken || inviteRole));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);

    // Authenticate against the real backend first (POST /api/v1/auth/login via the
    // "credentials" provider — this mints the backend access token the portals'
    // API proxies need). Fall back to the local Prisma provider only if the
    // backend is unreachable / the account lives only in the local dev DB.
    const creds = { email: email.trim().toLowerCase(), password, redirect: false } as const;
    let res = await signIn("credentials", creds);
    if (!res || res.error) {
      res = await signIn("local-credentials", creds);
    }

    if (!res || res.error) {
      setError("That email and password don't match. Try again.");
      setSubmitting(false);
      return;
    }

    const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
    const session = (await sessionRes.json().catch(() => null)) as {
      user?: { role?: string; email?: string | null };
    } | null;
    const role = session?.user?.role ?? "contributor";

    if (inviteToken && inviteRole === "enterprise" && role === "enterprise") {
      markAdminSignInFromInvite(inviteToken);
    }

    let dest = resolvePostLogin({
      sessionRole: role,
      inviteRole,
      returnTo,
      hasInvite: Boolean(inviteToken || inviteRole),
    });

    if (role === "mentor" && !returnTo) {
      const meRes = await fetch("/api/mentor/me", { cache: "no-store" });
      if (meRes.ok) {
        const me = (await meRes.json()) as { onboardingComplete?: boolean };
        if (!me.onboardingComplete) dest = "/mentor/onboarding";
      }
    }

    if (role === "enterprise" && !returnTo && !(inviteToken && inviteRole === "enterprise")) {
      const meRes = await fetch("/api/me", { cache: "no-store" });
      if (meRes.ok) {
        const me = (await meRes.json()) as MeResponse;
        dest = resolveEnterprisePostLogin({
          me,
          email: session?.user?.email ?? me.user?.email,
        });
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

  const emailForm = (
    <form onSubmit={onSubmit} className="space-y-4">
      <AuthField label="Email" htmlFor="login-email">
        <input
          id="login-email"
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
        htmlFor="login-password"
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
            id="login-password"
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
  );

  const ssoBlock = (
    <LoginOAuthRow
      onGoogle={() => onOauth("google")}
      onMicrosoft={() => onOauth("microsoft")}
      googleBusy={oauthBusy === "google"}
      microsoftBusy={oauthBusy === "microsoft"}
      disabled={submitting}
    />
  );

  return (
    <LoginShell>
      <header className="mb-6">
        <h1 className="font-display text-[27px] font-bold text-foreground tracking-[-0.03em] leading-none">
          Welcome back
        </h1>
        <p className="mt-2 font-body text-[14px] text-text-secondary">
          Sign in to your GlimmoraTeam workspace
        </p>
      </header>

      {hasInvite && inviteSpec ? <LoginInviteStrip label={inviteSpec.label} /> : null}
      {notice && !error ? <AuthAlert variant="info">{notice}</AuthAlert> : null}
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      {ssoFirst ? (
        <>
          {ssoBlock}
          <LoginDivider label="or use email" />
          {emailForm}
        </>
      ) : (
        <>
          {emailForm}
          <LoginDivider />
          {ssoBlock}
        </>
      )}

      <p className="mt-6 pt-5 border-t border-stroke-subtle text-center font-body text-[13px] text-text-secondary">
        No account? <AuthHeaderLink href="/auth/register">Create one</AuthHeaderLink>
      </p>

      <p className="mt-4 font-body text-[11px] text-text-tertiary text-center leading-relaxed">
        By signing in you agree to our{" "}
        <Link href="/legal/terms" className="underline underline-offset-2 hover:text-foreground">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/legal/privacy" className="underline underline-offset-2 hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>
    </LoginShell>
  );
}
