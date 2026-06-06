"use client";

/**
 * Per-portal login form, NextAuth-backed.
 *
 * Reuses the shared NextAuth `signIn("credentials")` flow (same as
 * /auth/login) but branded per portal and with a portal-scope check: after a
 * successful sign-in we confirm the user's role maps to THIS portal; if not,
 * we sign them back out and show a "wrong portal" message rather than letting
 * the proxy bounce them. On success we hand off to /auth/redirect, which
 * routes by role (single source of truth in lib/auth/portal-access).
 */

import { useState } from "react";
import { signIn, getSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { apiCall } from "@/lib/api/client";
import { PORTALS, rolePortal, type PortalKey } from "@/lib/auth/portal-access";

/**
 * Split-screen branded shell wrapping the form. Themed to match the home page
 * (warm brown→gold gradient, gold accents, beige surface) so every portal
 * login looks consistent with the landing page.
 */
export function PortalLoginScreen({ portal }: { portal: PortalKey }) {
  const def = PORTALS[portal];
  return (
    <div className="flex min-h-screen">
      {/* Left — warm brand panel (matches home palette) */}
      <div className="relative hidden w-[440px] flex-col justify-between overflow-hidden p-10 text-white lg:flex
                      bg-[linear-gradient(150deg,#3a2a1a_0%,#6b4a22_45%,#a47b2e_100%)]">
        {/* subtle gold glow */}
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold-400/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-gold-300/10 blur-3xl" />

        <Link
          href="/"
          className="relative inline-flex w-fit items-center rounded-lg bg-white/15 px-3 py-2 ring-1 ring-white/20 transition-colors hover:bg-white/25"
        >
          <div className="relative h-8 w-32">
            <Image src="/logo.png" alt="GlimmoraTeam" fill className="object-contain object-left" />
          </div>
        </Link>

        <div className="relative space-y-4">
          <span className="inline-block rounded-full bg-gold-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold-100 ring-1 ring-gold-300/30">
            {def.name}
          </span>
          <h2 className="font-heading text-3xl font-bold leading-tight">Welcome back to GlimmoraTeam</h2>
          <p className="text-base leading-relaxed text-white/75">{def.description}</p>
        </div>

        <p className="relative text-sm text-white/40">&copy; 2026 GlimmoraTeam. All rights reserved.</p>
      </div>

      {/* Right — form on warm surface */}
      <div className="flex flex-1 items-center justify-center bg-beige-50 p-6">
        <div className="w-full max-w-[420px]">
          <PortalLoginForm portal={portal} />
        </div>
      </div>
    </div>
  );
}

export default function PortalLoginForm({ portal }: { portal: PortalKey }) {
  const def = PORTALS[portal];
  // The contributor portal is the open one (freelancers/students/women/internal)
  // — it allows OAuth + self-signup. All other portals are provisioned by the
  // Super Admin, so they show no signup/OAuth.
  const isOpenPortal = portal === "contributor";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (!result?.ok || result.error) {
        // signIn fails for a provisioned account whose password isn't set yet —
        // the backend returns `needs_password_setup` and emails an OTP. Detect
        // that and route to the portal's setup-password page.
        try {
          const v = await apiCall<{ status?: string }>("/api/auth/validate", {
            method: "POST",
            body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
          });
          if (v?.status === "needs_password_setup") {
            window.location.href = `${def.basePath}/setup-password?email=${encodeURIComponent(email.trim().toLowerCase())}`;
            return;
          }
        } catch { /* fall through to generic error */ }
        setError("Invalid email or password.");
        setIsLoading(false);
        return;
      }

      // Confirm the signed-in role belongs to this portal.
      const session = await getSession();
      const role = (session?.user as { role?: string } | undefined)?.role;
      if (rolePortal(role) !== portal) {
        await signOut({ redirect: false });
        setError(
          `This is the ${def.name}. Your account isn't a ${def.name.toLowerCase()} account — please use your own portal's login.`,
        );
        setIsLoading(false);
        return;
      }

      // Role matches — route by role (handles onboarding / multi-portal too).
      window.location.href = "/auth/redirect";
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-brown-950">
          Welcome back
        </h1>
        <p className="text-sm text-beige-500">Sign in to the {def.name}</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-brown-900">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            disabled={isLoading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn(
              "flex h-11 w-full rounded-lg border border-beige-200 bg-white px-3 text-sm transition-colors",
              "placeholder:text-beige-400 hover:border-beige-400",
              "focus:outline-none focus:ring-2 focus:ring-brown-400 focus:ring-offset-1",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-brown-900">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(
                "flex h-11 w-full rounded-lg border border-beige-200 bg-white pl-3 pr-10 text-sm transition-colors",
                "placeholder:text-beige-400 hover:border-beige-400",
                "focus:outline-none focus:ring-2 focus:ring-brown-400 focus:ring-offset-1",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-beige-400 hover:text-brown-700"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Link
            href={`${def.basePath}/forgot-password`}
            className="text-sm text-brown-600 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold text-white shadow-lg shadow-brown-500/20 transition-all",
            "bg-[linear-gradient(135deg,#6b4a22_0%,#a47b2e_100%)] hover:shadow-brown-500/40 hover:brightness-105",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </button>

        {/* OAuth + self-signup ONLY for the open contributor portal.
            Admin / Enterprise / Mentor get credentials from the Super Admin. */}
        {isOpenPortal ? (
          <>
            <div className="flex items-center gap-3 py-1">
              <span className="h-px flex-1 bg-beige-200" />
              <span className="text-xs text-beige-400">or</span>
              <span className="h-px flex-1 bg-beige-200" />
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => signIn("google", { callbackUrl: "/auth/redirect" })}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-beige-200 bg-white text-sm font-medium text-brown-900 transition-colors hover:bg-beige-50 disabled:opacity-60"
            >
              <span className="font-semibold text-[#4285F4]">G</span> Continue with Google
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => signIn("microsoft-entra-id", { callbackUrl: "/auth/redirect" })}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-beige-200 bg-white text-sm font-medium text-brown-900 transition-colors hover:bg-beige-50 disabled:opacity-60"
            >
              <span className="font-semibold text-[#00A4EF]">⊞</span> Continue with Microsoft
            </button>

            <p className="text-center text-sm text-beige-500">
              New here?{" "}
              <Link href={`${def.basePath}/signup`} className="font-medium text-brown-700 hover:underline">
                Create an account
              </Link>
            </p>
          </>
        ) : (
          <p className="text-center text-xs text-beige-400">
            Accounts are provisioned by your administrator. Use the credentials sent to your email.
          </p>
        )}
      </form>
    </div>
  );
}
