"use client";

/**
 * Admin login — dedicated super-admin sign-in at /admin/login.
 * Only email/password + forgot-password. No SSO, no "create account".
 * Authenticates against the real backend (signIn "credentials" → glimmoraAccessToken)
 * and routes admins to /admin/dashboard. Forced first-login reset is honored.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import {
  AuthScreen,
  AuthField,
  AuthAlert,
  AuthSubmitButton,
  AuthHeaderLink,
  authInputCls,
} from "@/components/auth/auth-screen";
import { cn } from "@/lib/utils/cn";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPwd, setShowPwd] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const canSubmit = email.includes("@") && password.length >= 4 && !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);

    // Backend credentials provider — returns a real glimmoraAccessToken.
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

    // Read the session to confirm the role + check forced-reset.
    const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
    const session = (await sessionRes.json().catch(() => null)) as {
      user?: { role?: string; requiresPasswordChange?: boolean; isFirstLogin?: boolean };
    } | null;
    const role = session?.user?.role ?? "";

    // Forced first-login password reset (default/temp password → set a new one)
    // — same pattern as enterprise (/admin/reset-password).
    if (session?.user?.requiresPasswordChange || session?.user?.isFirstLogin) {
      router.push("/admin/reset-password");
      return;
    }

    // Only platform admins belong here.
    if (role === "admin" || role === "super_admin" || role === "superadmin") {
      router.push("/admin/dashboard");
      return;
    }

    setError("This sign-in is for platform administrators only.");
    setSubmitting(false);
  }

  return (
    <AuthScreen
      title="Admin sign in"
      subtitle="Sign in to the Glimmora platform admin console."
      footer={
        <>
          Forgot your password?{" "}
          <AuthHeaderLink href="/auth/forgot-password?return=/admin/login">Reset it</AuthHeaderLink>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <AuthAlert variant="error">{error}</AuthAlert>}

        <AuthField label="Email" htmlFor="admin-email">
          <input
            id="admin-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@glimmora.ai"
            className={authInputCls}
            required
          />
        </AuthField>

        <AuthField label="Password" htmlFor="admin-password">
          <div className="relative">
            <input
              id="admin-password"
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className={cn(authInputCls, "pr-10")}
              required
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

        <AuthSubmitButton disabled={!canSubmit}>
          {submitting ? "Verifying…" : "Sign in"}
        </AuthSubmitButton>
      </form>
    </AuthScreen>
  );
}
