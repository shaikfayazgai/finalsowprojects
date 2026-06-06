"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, ArrowLeft, Mail, AlertCircle, CheckCircle2,
  RefreshCw, Send, ShieldCheck, Lock, KeyRound, Clock,
  Shield, Zap,
} from "lucide-react";
import { Input, Label } from "@/components/ui";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

type Step = "email" | "sent";

const PLATFORM_STATS = [
  { value: "50K+",  label: "Contributors" },
  { value: "2,400+", label: "Enterprises" },
  { value: "99.9%", label: "Uptime SLA" },
];

const TRUST_BADGES = [
  { Icon: Shield,     label: "SOC 2 Certified" },
  { Icon: Lock,       label: "256-bit Encryption" },
  { Icon: Zap,        label: "99.9% Uptime SLA" },
  { Icon: ShieldCheck, label: "GDPR Compliant" },
];

export default function ForgotPasswordPage() {
  const [step, setStep]                     = useState<Step>("email");
  const [email, setEmail]                   = useState("");
  const [isLoading, setIsLoading]           = useState(false);
  const [error, setError]                   = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const startCooldown = useCallback(() => {
    setResendCooldown(60);
    const tick = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) { clearInterval(tick); return 0; }
        return c - 1;
      });
    }, 1000);
  }, []);

  const sendResetEmail = async (emailAddress: string) => {
    setError("");
    setIsLoading(true);
    try {
      await authApi.requestPasswordReset(emailAddress.trim().toLowerCase());
      setStep("sent");
      startCooldown();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email address"); return; }
    await sendResetEmail(email);
  };

  return (
    <div className="w-full flex items-start gap-16 max-w-7xl mx-auto px-8">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col flex-1 max-w-lg pt-8 pb-8 pr-10 gap-14">

        {/* Branding + Headline */}
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
            Forgot your <span className="text-teal-600">password?</span>
          </h2>

          <p className="text-sm text-beige-600 leading-relaxed max-w-sm">
            Enter your registered email and we&apos;ll send you a secure
            reset link. Back in your dashboard in minutes.
          </p>
        </div>

        {/* Stats + Badges */}
        <div>
          <div className="flex items-center gap-8 mb-8">
            {PLATFORM_STATS.map(({ value, label }, i) => (
              <div key={label} className={`${i > 0 ? "pl-8 border-l border-beige-200" : ""}`}>
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

          {/* ── Step 1: Email input ── */}
          {step === "email" && (
            <motion.div
              key="email-step"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="rounded-2xl p-8 space-y-6"
              style={{
                background: "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(0, 0, 0, 0.06)",
                boxShadow: "0 4px 32px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04)",
              }}
            >
              {/* Header */}
              <div>
                <div className="w-11 h-11 rounded-xl bg-brown-50 border border-brown-100 flex items-center justify-center mb-4">
                  <KeyRound className="w-5 h-5 text-brown-500" />
                </div>
                <h1 className="font-heading text-[22px] font-bold text-brown-950">Reset your password</h1>
                <p className="text-sm text-beige-500 mt-1">Enter your email and we&apos;ll send a secure reset link</p>
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
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    autoComplete="email"
                    autoFocus
                    className="h-11"
                  />
                </div>

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
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Sending…</>
                  ) : (
                    <><Send className="w-4 h-4" /> Send Reset Link</>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <Link
                href="/auth/login"
                className="flex items-center justify-center gap-2 text-sm text-beige-500 hover:text-brown-700 transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" /> Back to sign in
              </Link>
            </motion.div>
          )}

          {/* ── Step 2: Sent confirmation ── */}
          {step === "sent" && (
            <motion.div
              key="sent-step"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="rounded-2xl p-8 space-y-6"
              style={{
                background: "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(0, 0, 0, 0.06)",
                boxShadow: "0 4px 32px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04)",
              }}
            >
              {/* Success icon + heading */}
              <div className="flex flex-col items-center text-center gap-3 pt-2">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
                  className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center"
                >
                  <Mail className="w-8 h-8 text-teal-600" />
                </motion.div>
                <div>
                  <h1 className="font-heading text-[22px] font-bold text-brown-950">Check your inbox</h1>
                  <p className="text-sm text-beige-500 mt-1">We sent a password reset link to</p>
                  <p className="text-sm font-semibold text-brown-800 mt-0.5 break-all">{email}</p>
                </div>
              </div>

              {/* Info checklist */}
              <div className="rounded-xl bg-beige-50 border border-beige-100 p-4 space-y-3">
                {[
                  { Icon: Clock,        text: "Link expires in 30 minutes" },
                  { Icon: Mail,         text: "Check your spam folder if you don't see it" },
                  { Icon: CheckCircle2, text: "The link can only be used once" },
                ].map(({ Icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5">
                    <Icon className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <p className="text-xs text-beige-600">{text}</p>
                  </div>
                ))}
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    key="resend-err"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="space-y-3 pt-1">
                <Link
                  href="/auth/login"
                  className="flex items-center justify-center gap-2 w-full h-11 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{
                    background: "linear-gradient(135deg, #A67763, #886151)",
                    boxShadow: "0 2px 12px rgba(166,119,99,0.35)",
                  }}
                >
                  <CheckCircle2 className="w-4 h-4" /> Back to Sign In
                </Link>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => { setStep("email"); setError(""); }}
                    className="text-beige-400 hover:text-brown-600 transition-colors font-medium"
                  >
                    Use a different email
                  </button>

                  {resendCooldown > 0 ? (
                    <p className="text-beige-400">
                      Resend in <span className="font-semibold text-brown-600">{resendCooldown}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => sendResetEmail(email)}
                      disabled={isLoading}
                      className="text-teal-600 hover:text-teal-700 font-medium transition-colors disabled:opacity-50"
                    >
                      {isLoading ? "Resending…" : "Resend link"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
