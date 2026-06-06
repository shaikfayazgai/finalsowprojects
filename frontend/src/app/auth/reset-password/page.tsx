"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, AlertCircle, CheckCircle2, RefreshCw,
  Lock, Shield, ShieldCheck, KeyRound, Zap,
} from "lucide-react";
import { Input, Label } from "@/components/ui";
import { fetchInternal } from "@/lib/api/client";

const PLATFORM_STATS = [
  { value: "50K+",   label: "Contributors" },
  { value: "2,400+", label: "Enterprises" },
  { value: "99.9%",  label: "Uptime SLA" },
];

const TRUST_BADGES = [
  { Icon: Shield,      label: "SOC 2 Certified" },
  { Icon: Lock,        label: "256-bit Encryption" },
  { Icon: Zap,         label: "99.9% Uptime SLA" },
  { Icon: ShieldCheck, label: "GDPR Compliant" },
];

const REQUIREMENTS = [
  { check: (pw: string) => pw.length >= 8, text: "At least 8 characters" },
  { check: (pw: string) => /[A-Z]/.test(pw), text: "Uppercase letter" },
  { check: (pw: string) => /[a-z]/.test(pw), text: "Lowercase letter" },
  { check: (pw: string) => /[0-9]/.test(pw), text: "Number" },
];

// Backend-issued reset-flow error codes → user-friendly messages.
const RESET_ERROR_MESSAGES: Record<string, string> = {
  RESET_TOKEN_NOT_FOUND:  "Reset link is invalid. Request a new one.",
  RESET_TOKEN_SUPERSEDED: "A newer reset link was issued. Use the latest email.",
  RESET_TOKEN_USED:       "This reset link was already used. Request a new one.",
  RESET_TOKEN_EXPIRED:    "This reset link has expired. Request a new one.",
  PASSWORD_TOO_SHORT:     "Password must be at least 8 characters.",
  PASSWORDS_DO_NOT_MATCH: "Passwords do not match.",
};
const RESET_ERROR_FALLBACK = "Invalid reset link.";

function getStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8)            score++;
  if (pw.length >= 12)           score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw))  score++;
  if (score <= 1) return { score, label: "Weak",   color: "bg-red-400",  text: "text-red-500" };
  if (score <= 3) return { score, label: "Fair",   color: "bg-gold-400", text: "text-gold-600" };
  return             { score, label: "Strong", color: "bg-teal-500", text: "text-teal-600" };
}

function ResetPasswordContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token") ?? "";

  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [showPasswords, setShow]    = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState(false);

  // ── Invalid / missing token ──
  if (!token) {
    return (
      <div className="w-full flex items-start gap-16 max-w-7xl mx-auto px-8">
        {/* Left panel */}
        <div className="hidden lg:flex flex-col flex-1 max-w-lg pt-8 pb-8 pr-10 gap-14">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-8 group w-fit">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-brown-500 to-brown-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-semibold text-brown-950 group-hover:text-brown-700 transition-colors">
                GlimmoraTeam
              </span>
            </Link>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-600 mb-4 flex items-center gap-2">
              <span className="w-5 h-px bg-teal-500" />
              Account Recovery
            </p>
            <h2 className="font-heading text-4xl font-bold text-brown-950 leading-[1.2] mb-5">
              Set a new <span className="text-teal-600">password</span>.
            </h2>
            <p className="text-sm text-beige-600 leading-relaxed max-w-sm">
              Choose a strong password to secure your GlimmoraTeam workspace.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-8 mb-8">
              {PLATFORM_STATS.map(({ value, label }, i) => (
                <div key={label} className={i > 0 ? "pl-8 border-l border-beige-200" : ""}>
                  <p className="font-heading text-2xl font-bold text-brown-950">{value}</p>
                  <p className="text-xs text-beige-500 mt-1">{label}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              {TRUST_BADGES.map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/50 border border-beige-100">
                  <Icon className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span className="text-xs text-brown-700 font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-full max-w-[440px] flex flex-col justify-center pt-8">
          <Link href="/" className="lg:hidden inline-flex items-center gap-2 mb-6 group">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-brown-500 to-brown-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-semibold text-brown-950">GlimmoraTeam</span>
          </Link>
          <div
            className="rounded-2xl p-8 space-y-6 text-center"
            style={{
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 4px 32px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <div>
              <h1 className="font-heading text-[22px] font-bold text-brown-950">Link expired or invalid</h1>
              <p className="text-sm text-beige-500 mt-2">
                Password reset links expire after 30 minutes. Please request a fresh one.
              </p>
            </div>
            <Link
              href="/auth/forgot-password"
              className="flex items-center justify-center gap-2 w-full h-11 rounded-xl text-sm font-semibold text-white transition-all"
              style={{
                background: "linear-gradient(135deg, #A67763, #886151)",
                boxShadow: "0 2px 12px rgba(166,119,99,0.35)",
              }}
            >
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const strength = getStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm)  { setError("Passwords do not match"); return; }

    setError("");
    setIsLoading(true);
    try {
      const res = await fetchInternal("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: password,
          confirmPassword: confirm,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const detail = err?.detail;
        const code = typeof detail === "object" && detail !== null && typeof detail.code === "string"
          ? detail.code
          : "";
        setError((code && RESET_ERROR_MESSAGES[code]) || RESET_ERROR_FALLBACK);
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/auth/login"), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex items-start gap-16 max-w-7xl mx-auto px-8">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col flex-1 max-w-lg pt-8 pb-8 pr-10 gap-14">
        <div>
          <Link href="/" className="flex items-center gap-2 mb-8 group w-fit">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-brown-500 to-brown-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-semibold text-brown-950 group-hover:text-brown-700 transition-colors">
              GlimmoraTeam
            </span>
          </Link>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-600 mb-4 flex items-center gap-2">
            <span className="w-5 h-px bg-teal-500" />
            Account Recovery
          </p>
          <h2 className="font-heading text-4xl font-bold text-brown-950 leading-[1.2] mb-5">
            Set a new <span className="text-teal-600">password</span>.
          </h2>
          <p className="text-sm text-beige-600 leading-relaxed max-w-sm">
            Choose a strong password to secure your GlimmoraTeam workspace.
            You&apos;ll be signed in right after.
          </p>
        </div>

        <div>
          <div className="flex items-center gap-8 mb-8">
            {PLATFORM_STATS.map(({ value, label }, i) => (
              <div key={label} className={i > 0 ? "pl-8 border-l border-beige-200" : ""}>
                <p className="font-heading text-2xl font-bold text-brown-950">{value}</p>
                <p className="text-xs text-beige-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {TRUST_BADGES.map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/50 border border-beige-100">
                <Icon className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="text-xs text-brown-700 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div className="w-full max-w-[440px] flex flex-col justify-center pt-8">

        {/* Mobile logo */}
        <Link href="/" className="lg:hidden inline-flex items-center gap-2 mb-6 group">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-brown-500 to-brown-700 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-semibold text-brown-950">GlimmoraTeam</span>
        </Link>

        <AnimatePresence mode="wait">

          {/* ── Form ── */}
          {!success && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="rounded-2xl p-8 space-y-6"
              style={{
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 4px 32px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              {/* Header */}
              <div>
                <div className="w-11 h-11 rounded-xl bg-brown-50 border border-brown-100 flex items-center justify-center mb-4">
                  <KeyRound className="w-5 h-5 text-brown-500" />
                </div>
                <h1 className="font-heading text-[22px] font-bold text-brown-950">Set new password</h1>
                <p className="text-sm text-beige-500 mt-1">Choose a strong password for your account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    New Password
                  </Label>
                  <Input
                    id="password"
                    type={showPasswords ? "text" : "password"}
                    placeholder="Min. 10 characters"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(""); }}
                    className="h-11"
                    autoFocus
                  />
                  {/* Strength meter */}
                  {password && (
                    <div className="space-y-1 pt-1">
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(i => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              i <= strength.score ? strength.color : "bg-beige-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs font-medium ${strength.text}`}>{strength.label}</p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirm" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirm"
                    type={showPasswords ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={confirm}
                    onChange={e => { setConfirm(e.target.value); setError(""); }}
                    className="h-11"
                  />
                  {confirm && password !== confirm && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" /> Passwords do not match
                    </p>
                  )}
                  {confirm && password === confirm && password.length > 0 && (
                    <p className="text-xs text-teal-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 shrink-0" /> Passwords match
                    </p>
                  )}
                </div>

                {/* Show passwords checkbox */}
                <label className="flex items-center gap-2.5 cursor-pointer w-fit">
                  <input
                    type="checkbox"
                    checked={showPasswords}
                    onChange={e => setShow(e.target.checked)}
                    className="w-4 h-4 rounded border-beige-300 accent-brown-500"
                  />
                  <span className="text-sm text-beige-600 select-none">Show passwords</span>
                </label>

                {/* Requirements */}
                <div className="rounded-xl bg-beige-50 border border-beige-100 p-4 space-y-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-beige-400 mb-1">
                    Requirements
                  </p>
                  {REQUIREMENTS.map(({ check, text }) => {
                    const met = check(password);
                    return (
                      <div key={text} className="flex items-center gap-2.5">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          met ? "bg-teal-500" : "bg-beige-200"
                        }`}>
                          {met && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className={`text-xs transition-colors ${met ? "text-teal-700 font-medium" : "text-beige-500"}`}>
                          {text}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      key="err"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {typeof error === "string" ? error : "An error occurred"}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: isLoading ? "rgba(166,119,99,0.6)" : "linear-gradient(135deg, #A67763, #886151)",
                    boxShadow: isLoading ? "none" : "0 2px 12px rgba(166,119,99,0.35)",
                  }}
                >
                  {isLoading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Updating…</>
                  ) : (
                    <><Lock className="w-4 h-4" /> Update Password</>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* ── Success ── */}
          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="rounded-2xl p-8 space-y-6 text-center"
              style={{
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 4px 32px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
                className="mx-auto w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center"
              >
                <CheckCircle2 className="w-8 h-8 text-teal-600" />
              </motion.div>
              <div>
                <h1 className="font-heading text-[22px] font-bold text-brown-950">Password updated!</h1>
                <p className="text-sm text-beige-500 mt-2">
                  Your password has been changed successfully. Redirecting you to sign in…
                </p>
              </div>
              <Link
                href="/auth/login"
                className="flex items-center justify-center gap-2 w-full h-11 rounded-xl text-sm font-semibold text-white transition-all"
                style={{
                  background: "linear-gradient(135deg, #A67763, #886151)",
                  boxShadow: "0 2px 12px rgba(166,119,99,0.35)",
                }}
              >
                <CheckCircle2 className="w-4 h-4" /> Go to Sign In
              </Link>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
