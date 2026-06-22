"use client";

/**
 * Enterprise sign-in — dedicated portal login.
 *
 * Scoped to the enterprise panel only. Mirrors the platform login styling
 * (premium aurora split-screen brand panel) but exposes ONLY:
 *   1. Email + password sign-in
 *   2. Forgot password (OTP-based — see /enterprise/forgot-password)
 *
 * No self-registration and no SSO/OAuth buttons — enterprise accounts are
 * provisioned, and this page is the admin-style entry point for them.
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
import { LoginShell } from "@/app/auth/login/_components/login-layout";
import { resolveEnterprisePostLogin } from "@/lib/admin/invite-routes";
import type { MeResponse } from "@/lib/hooks/use-me";
import { cn } from "@/lib/utils/cn";

function safeReturnTo(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  return raw;
}

function EnterpriseLoginScreen() {
  const router = useRouter();
  const sp = useSearchParams();
  const returnTo = safeReturnTo(sp.get("returnTo"));
  const reason = sp.get("reason");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPwd, setShowPwd] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notice] = React.useState<string | null>(
    reason === "unauthenticated" || reason === "session_expired"
      ? "Your session expired. Sign in again to continue."
      : reason === "portal_mismatch"
        ? "That account doesn't have access to the enterprise portal."
        : reason === "password_changed"
          ? "Your password has been updated. Sign in with your new password."
          : null,
  );
  const [submitting, setSubmitting] = React.useState(false);

  const canSubmit = email.includes("@") && password.length >= 4 && !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);

    // Use the backend-backed "credentials" provider (calls the FastAPI
    // /api/v1/auth/login where super-admin-provisioned accounts live), NOT
    // "local-credentials" (which only checks the Prisma User table). This is
    // also the only provider that surfaces `requiresPasswordChange`.
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
      user?: { role?: string; email?: string | null; requiresPasswordChange?: boolean };
    } | null;
    const role = session?.user?.role ?? "contributor";

    // This is the enterprise portal door — only enterprise/admin roles belong here.
    const enterpriseRoles = ["enterprise", "reviewer", "admin", "super_admin"];
    if (!enterpriseRoles.includes(role)) {
      setError("That account doesn't have access to the enterprise portal.");
      setSubmitting(false);
      return;
    }

    // Forced first-login reset: a freshly-provisioned account (default password)
    // must set a new password before reaching any portal route.
    if (session?.user?.requiresPasswordChange) {
      router.push("/enterprise/reset-password");
      return;
    }

    // Honour an explicit returnTo if it points back into the enterprise portal.
    if (returnTo && returnTo.startsWith("/enterprise")) {
      router.push(returnTo);
      return;
    }

    if (role === "reviewer") {
      router.push("/enterprise/reviewer");
      return;
    }

    // Resolve the right enterprise landing (onboarding vs dashboard).
    let dest = "/enterprise/dashboard";
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

    router.push(dest);
  }

  return (
    <LoginShell>
      <header className="mb-6">
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-emphasis mb-2">
          Enterprise Portal
        </p>
        <h1 className="font-display text-[27px] font-bold text-foreground tracking-[-0.03em] leading-none">
          Sign in
        </h1>
        <p className="mt-2 font-body text-[14px] text-text-secondary">
          Access your GlimmoraTeam enterprise workspace
        </p>
      </header>

      {notice && !error ? <AuthAlert variant="info">{notice}</AuthAlert> : null}
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <AuthField label="Email" htmlFor="ent-login-email">
          <input
            id="ent-login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className={authInputCls}
            required
            aria-required="true"
          />
        </AuthField>

        <AuthField
          label="Password"
          htmlFor="ent-login-password"
          labelExtra={
            <Link
              href="/enterprise/forgot-password"
              className="font-body text-[12.5px] font-semibold text-text-link hover:underline underline-offset-2"
            >
              Forgot?
            </Link>
          }
        >
          <div className="relative">
            <input
              id="ent-login-password"
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

      <p className="mt-6 pt-5 border-t border-stroke-subtle font-body text-[12px] text-text-tertiary text-center leading-relaxed">
        Enterprise access is provisioned by your administrator.
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

export default function EnterpriseLoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-dvh bg-surface" />}>
      <EnterpriseLoginScreen />
    </React.Suspense>
  );
}
