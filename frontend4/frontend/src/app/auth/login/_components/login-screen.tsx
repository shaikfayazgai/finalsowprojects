"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle, Eye, EyeOff, Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  AuthDivider,
  AuthField,
  AuthHeaderLink,
  AuthLegalFooter,
  AuthScreen,
  AuthSubmitButton,
  OAuthButtonStack,
  authInputCls,
} from "@/components/auth/auth-screen";
import { AuthBrandMark } from "@/components/auth/auth-split-layout";
import {
  findSpecByJwtRole,
  resolvePostLogin,
} from "@/lib/admin/invite-routes";
import { markAdminSignInFromInvite, markAdminSignInByEmail } from "@/lib/stores/admin-provisioning-store";

function safeReturnTo(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  // Never honour a returnTo that points back at an auth/login page — doing so
  // bounces the just-signed-in user straight back to the login screen
  // ("Please sign in to continue" loop). Strip the query before matching so a
  // truncated/encoded value like "/enterprise/l" can't slip through either.
  const path = raw.split(/[?#]/)[0] ?? raw;
  if (path === "/" || path.startsWith("/auth")) return null;
  if (path.endsWith("/login") || path.endsWith("/l") || path.includes("/login")) {
    return null;
  }
  return raw;
}

export function LoginScreen({
  portalLabel,
  showOauth = false,
}: {
  /** Optional portal name shown in the title (e.g. "Enterprise"). */
  portalLabel?: string;
  /** Show Google/Microsoft SSO (only the contributor portal sets this true). */
  showOauth?: boolean;
} = {}) {
  const router = useRouter();
  const sp = useSearchParams();
  const returnTo = safeReturnTo(sp.get("returnTo"));
  const reason = sp.get("reason");
  const inviteToken = sp.get("invite");
  const inviteRole = sp.get("role");
  const inviteSpec = findSpecByJwtRole(inviteRole);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPwd, setShowPwd] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notice] = React.useState<string | null>(
    reason === "unauthenticated" ? "Please sign in to continue." : null,
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [oauthBusy, setOauthBusy] = React.useState<"google" | "microsoft" | null>(null);

  const canSubmit = email.includes("@") && password.length >= 4 && !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);

    const normalizedEmail = email.trim().toLowerCase();

    // Primary: the FastAPI backend (superadmin / enterprise / mentor / reviewer
    // / contributor accounts live there). Fallback: the local Prisma DB, which
    // holds self-signup accounts (e.g. women contributors registered directly).
    let res = await signIn("credentials", {
      email: normalizedEmail,
      password,
      redirect: false,
    });
    if (!res || res.error) {
      res = await signIn("local-credentials", {
        email: normalizedEmail,
        password,
        redirect: false,
      });
    }

    if (!res || res.error) {
      setError("That email and password don't match. Try again.");
      setSubmitting(false);
      return;
    }

    const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
    const session = (await sessionRes.json().catch(() => null)) as {
      user?: { role?: string; requiresPasswordChange?: boolean };
    } | null;
    const role = session?.user?.role ?? "contributor";

    // First-time login with a superadmin-provisioned default/temp password:
    // the account is flagged must_change_password — force the reset screen
    // before they can reach any portal.
    if (session?.user?.requiresPasswordChange) {
      router.push("/auth/change-password");
      return;
    }

    if (inviteToken && inviteRole === "enterprise" && role === "enterprise") {
      markAdminSignInFromInvite(inviteToken);
    }
    // Credential-based (no invite): mark the tenant's "First admin sign-in"
    // provisioning step done when the enterprise admin signs in.
    if (role === "enterprise") {
      markAdminSignInByEmail(normalizedEmail);
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
    <AuthScreen
      leading={<AuthBrandMark className="lg:hidden" />}
      title={portalLabel ? `Sign in to ${portalLabel}` : "Sign in to GlimmoraTeam"}
      subtitle="Access your workforce workspace"
      footer={
        <>
          Don&apos;t have an account? <AuthHeaderLink href="/auth/register">Sign up</AuthHeaderLink>
        </>
      }
    >
      {inviteSpec && (inviteToken || inviteRole) && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-brand/25 bg-brand-subtle/40 px-3.5 py-2.5 flex items-start gap-2.5"
        >
          <Info className="h-4 w-4 text-brand shrink-0 mt-0.5" strokeWidth={1.75} aria-hidden />
          <p className="font-body text-[12.5px] text-text-secondary flex-1">
            You&apos;ve been invited as <strong className="text-foreground">{inviteSpec.label}</strong>.
            Sign in to continue — you&apos;ll land on{" "}
            <code className="font-mono text-[11px]">{inviteSpec.postLoginPath}</code>.
          </p>
        </div>
      )}

      {notice && !error && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-stroke px-3.5 py-2.5 flex items-start gap-2.5"
        >
          <Info className="h-4 w-4 text-text-tertiary shrink-0 mt-0.5" strokeWidth={1.75} aria-hidden />
          <p className="font-body text-[12.5px] text-text-secondary flex-1">{notice}</p>
        </div>
      )}

      {/* SSO (Google/Microsoft) only on the contributor login (showOauth=true).
          Provisioned roles (enterprise/admin/mentor/reviewer) sign in with
          email + password only. */}
      {showOauth && (
        <>
          <OAuthButtonStack
            onGoogle={() => onOauth("google")}
            onMicrosoft={() => onOauth("microsoft")}
            googleBusy={oauthBusy === "google"}
            microsoftBusy={oauthBusy === "microsoft"}
            disabled={submitting}
          />
          <AuthDivider />
        </>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-error-border bg-error-subtle px-3.5 py-2.5 flex items-start gap-2.5"
          >
            <AlertCircle
              className="h-4 w-4 text-error-text shrink-0 mt-0.5"
              strokeWidth={1.75}
              aria-hidden
            />
            <p className="font-body text-[12.5px] text-error-text flex-1">{error}</p>
          </div>
        )}

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
              className="font-body text-[12.5px] font-semibold text-brand-emphasis hover:underline underline-offset-2"
            >
              Forgot password?
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
              placeholder="Enter password"
              className={cn(authInputCls, "pr-10")}
              required
              aria-required="true"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              aria-label={showPwd ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-foreground transition-colors duration-fast"
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
            className="h-3.5 w-3.5 rounded border-stroke text-brand focus:ring-brand shrink-0"
          />
          <span className="font-body text-[13px] text-text-secondary">Remember me</span>
        </label>

        <AuthSubmitButton disabled={!canSubmit} loading={submitting}>
          Continue
        </AuthSubmitButton>
      </form>

      <AuthLegalFooter />
    </AuthScreen>
  );
}
