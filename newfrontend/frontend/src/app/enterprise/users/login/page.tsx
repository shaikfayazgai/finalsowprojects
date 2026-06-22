"use client";

/**
 * Enterprise TEAM-MEMBER sign-in — the door for tenant *users* (PMO, Finance,
 * Security/IT, Legal, Sponsor, … incl. newly-created member roles).
 * Reviewers do NOT use this door — they sign in at /reviewer/login.
 *
 * The separate /enterprise/login door is reserved for the workspace ADMIN.
 * Any enterprise role can sign in here and lands on the shared workspace home;
 * roles only gate what's available inside (the sidebar exposes role-specific
 * areas like QA Review for reviewers).
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
import { cn } from "@/lib/utils/cn";

function safeReturnTo(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  return raw;
}

function EnterpriseUsersLoginScreen() {
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

    try {
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
        user?: { role?: string; requiresPasswordChange?: boolean };
      } | null;
      const role = session?.user?.role ?? "contributor";

      // Every tenant role resolves to the "enterprise" portal role — so members
      // and admins alike are welcome at this users door.
      const enterpriseRoles = ["enterprise", "reviewer", "admin", "super_admin"];
      if (!enterpriseRoles.includes(role)) {
        setError("That account doesn't have access to this workspace.");
        setSubmitting(false);
        return;
      }

      if (session?.user?.requiresPasswordChange) {
        router.push("/enterprise/reset-password");
        return;
      }

      if (returnTo && returnTo.startsWith("/enterprise")) {
        router.push(returnTo);
        return;
      }

      // Shared workspace home for tenant users (PMO, Finance, Security, Legal, …).
      // Reviewers do NOT use this door — they sign in at /reviewer/login.
      router.push("/enterprise/dashboard");
    } catch {
      setError("Couldn't reach the sign-in service. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <LoginShell>
      <header className="mb-6">
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-emphasis mb-2">
          Team Members
        </p>
        <h1 className="font-display text-[27px] font-bold text-foreground tracking-[-0.03em] leading-none">
          Sign in
        </h1>
        <p className="mt-2 font-body text-[14px] text-text-secondary">
          For PMO, Finance, Security, Legal and other workspace users
        </p>
      </header>

      {notice && !error ? <AuthAlert variant="info">{notice}</AuthAlert> : null}
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <AuthField label="Email" htmlFor="ent-users-email">
          <input
            id="ent-users-email"
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
          htmlFor="ent-users-password"
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
              id="ent-users-password"
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
        Workspace admin?{" "}
        <Link href="/enterprise/login" className="font-semibold text-text-link hover:underline underline-offset-2">
          Sign in here
        </Link>
        {" · "}Reviewer?{" "}
        <Link href="/reviewer/login" className="font-semibold text-text-link hover:underline underline-offset-2">
          Reviewer sign-in
        </Link>
        .
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

export default function EnterpriseUsersLoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-dvh bg-surface" />}>
      <EnterpriseUsersLoginScreen />
    </React.Suspense>
  );
}
