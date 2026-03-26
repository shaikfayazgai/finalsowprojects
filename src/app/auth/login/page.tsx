"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Sparkles, ArrowRight, Shield, Lock, Zap, AlertCircle, Eye, EyeOff,
} from "lucide-react";
import { roleDashboard } from "@/lib/config/auth";

export default function LoginPage() {
  return (
    <React.Suspense fallback={null}>
      <LoginForm />
    </React.Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [ssoNotice, setSsoNotice] = React.useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please check your credentials and try again.");
        setLoading(false);
        return;
      }

      // Fetch session to get role and redirect
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      const role = session?.user?.role;

      // Validate callbackUrl is a safe relative path
      const safeCallback = callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : null;
      router.push(safeCallback || roleDashboard[role] || "/contributor/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-up">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-brown-400 to-brown-600 mb-4">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h1 className="font-heading text-[26px] font-semibold text-gray-900">
          GlimmoraTeam
        </h1>
        <p className="text-[13px] text-gray-400 mt-1">
          AI-Governed Outcome Delivery Platform
        </p>
      </div>

      {/* Login card */}
      <div className="card-parchment p-8">
        <form onSubmit={handleLogin} className="space-y-5">
          {/* SSO notice */}
          {ssoNotice && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gold-50 text-gold-700">
              <Shield className="w-4 h-4 shrink-0" />
              <span className="text-[12px]">{ssoNotice}</span>
            </div>
          )}

          {/* Social buttons — 2-col grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Google */}
            <button
              type="button"
              onClick={() => { setSsoNotice("Google sign-in will be available once OAuth keys are configured."); setTimeout(() => setSsoNotice(""), 3000); }}
              className="w-full flex items-center justify-center gap-2.5 text-[13px] font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 px-4 py-2.5 rounded-xl transition-all"
            >
              <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>

            {/* Apple */}
            <button
              type="button"
              onClick={() => { setSsoNotice("Apple sign-in will be available once OAuth keys are configured."); setTimeout(() => setSsoNotice(""), 3000); }}
              className="w-full flex items-center justify-center gap-2.5 text-[13px] font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 px-4 py-2.5 rounded-xl transition-all"
            >
              <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Apple
            </button>
          </div>

          {/* Enterprise SSO — full width */}
          <button
            type="button"
            onClick={() => { setSsoNotice("Enterprise SSO requires Keycloak configuration. Contact your IT administrator."); setTimeout(() => setSsoNotice(""), 3000); }}
            className="w-full flex items-center justify-center gap-2.5 text-[13px] font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-100 px-4 py-2.5 rounded-xl transition-all"
          >
            <Shield className="w-[18px] h-[18px] text-gray-500 shrink-0" />
            Enterprise SSO
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "var(--border-soft)" }} />
            <span className="text-[11px] text-gray-400 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px" style={{ background: "var(--border-soft)" }} />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="text-[12px]">{error}</span>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-[12px] font-semibold text-gray-600">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., arjun@university.edu.in"
              autoComplete="email"
              required
              className="w-full text-[13px] text-gray-700 bg-white rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-[12px] font-semibold text-gray-600">Password</label>
              <Link href="/auth/forgot-password" className="text-[11px] text-brown-500 hover:text-brown-600 font-medium">Forgot password?</Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="w-full text-[13px] text-gray-700 bg-white rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 pr-10 outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 text-[13px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-5 py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>

      {/* Sign up link — outside card */}
      <div className="mt-5 text-center">
        <span className="text-[12px] text-gray-400">New contributor? </span>
        <Link href="/auth/register" className="text-[12px] font-medium text-brown-500 hover:text-brown-600">
          Create an account
        </Link>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-4 mt-6 text-[11px] text-gray-400">
        <div className="flex items-center gap-1">
          <Lock className="w-3 h-3" />
          <span>256-bit encryption</span>
        </div>
        <span>·</span>
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          <span>SOC 2 compliant</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
