"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Sparkles, ArrowRight, AlertCircle, Eye, EyeOff, Check, UserPlus, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [ssoNotice, setSsoNotice] = React.useState("");

  const passwordChecks = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains a number", met: /\d/.test(password) },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
  ];

  const allChecksMet = passwordChecks.every((c) => c.met);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const canSubmit = name.trim() && email.trim() && allChecksMet && passwordsMatch;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        name,
        isRegister: "true",
        redirect: false,
      });

      if (result?.error) {
        setError("Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      // Redirect to onboarding after successful registration
      router.push("/onboarding");
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
          <UserPlus className="w-6 h-6 text-white" />
        </div>
        <h1 className="font-heading text-[26px] font-semibold text-gray-900">
          Create your account
        </h1>
        <p className="text-[13px] text-gray-400 mt-1">
          Join GlimmoraTeam as a verified contributor
        </p>
      </div>

      {/* Registration card */}
      <div className="card-parchment p-8">
        <form onSubmit={handleRegister} className="space-y-4">
          {/* SSO notice */}
          {ssoNotice && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gold-50 text-gold-700">
              <Shield className="w-4 h-4 shrink-0" />
              <span className="text-[12px]">{ssoNotice}</span>
            </div>
          )}

          {/* Social sign-up — 2-col grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => { setSsoNotice("Google sign-up will be available once OAuth keys are configured."); setTimeout(() => setSsoNotice(""), 3000); }}
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
            <button
              type="button"
              onClick={() => { setSsoNotice("Apple sign-up will be available once OAuth keys are configured."); setTimeout(() => setSsoNotice(""), 3000); }}
              className="w-full flex items-center justify-center gap-2.5 text-[13px] font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 px-4 py-2.5 rounded-xl transition-all"
            >
              <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Apple
            </button>
          </div>

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

          {/* Full Name */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-[12px] font-semibold text-gray-600">Full Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Arjun Mehta"
              autoComplete="name"
              required
              className="w-full text-[13px] text-gray-700 bg-white rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="reg-email" className="text-[12px] font-semibold text-gray-600">Email</label>
            <input
              id="reg-email"
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
            <label htmlFor="reg-password" className="text-[12px] font-semibold text-gray-600">Password</label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
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
            {/* Password strength checklist */}
            {password.length > 0 && (
              <div className="flex flex-col gap-1 mt-2">
                {passwordChecks.map((check) => (
                  <div key={check.label} className="flex items-center gap-1.5">
                    <div className={cn(
                      "w-3.5 h-3.5 rounded-full flex items-center justify-center",
                      check.met ? "bg-forest-500" : "bg-gray-200"
                    )}>
                      {check.met && <Check className="w-2 h-2 text-white" />}
                    </div>
                    <span className={cn("text-[11px]", check.met ? "text-forest-600" : "text-gray-400")}>
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label htmlFor="confirm-password" className="text-[12px] font-semibold text-gray-600">Confirm Password</label>
            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              required
              className={cn(
                "w-full text-[13px] text-gray-700 bg-white rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all placeholder:text-gray-400",
                confirmPassword.length > 0 && !passwordsMatch
                  ? "focus:ring-red-200/50 ring-1 ring-red-200"
                  : "focus:ring-brown-200/50"
              )}
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-[11px] text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Terms */}
          <p className="text-[11px] text-gray-400 leading-relaxed">
            By creating an account, you agree to our{" "}
            <a href="#" target="_blank" className="text-brown-500 hover:text-brown-600">Terms of Service</a> and{" "}
            <a href="#" target="_blank" className="text-brown-500 hover:text-brown-600">Privacy Policy</a>.
          </p>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !canSubmit}
            className={cn(
              "w-full flex items-center justify-center gap-2 text-[13px] font-semibold px-5 py-3 rounded-xl transition-all",
              canSubmit && !loading
                ? "text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 shadow-md"
                : "text-gray-400 bg-gray-100 cursor-not-allowed"
            )}
          >
            {loading ? "Creating account..." : "Create Account"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>

      {/* Sign in link */}
      <div className="mt-5 text-center">
        <span className="text-[12px] text-gray-400">Already have an account? </span>
        <Link href="/auth/login" className="text-[12px] font-medium text-brown-500 hover:text-brown-600">
          Sign in
        </Link>
      </div>
    </div>
  );
}
