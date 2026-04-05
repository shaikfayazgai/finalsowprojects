"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles, ArrowLeft, Mail, AlertCircle, CheckCircle, RefreshCw, Send,
} from "lucide-react";
import { GlassCard, GlassCardContent, Button, Input, Label } from "@/components/ui";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

type Step = "email" | "sent";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep]               = useState<Step>("email");
  const [email, setEmail]             = useState("");
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend cooldown countdown
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
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email address"); return; }
    await sendResetEmail(email);
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isLoading) return;
    await sendResetEmail(email);
  };

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brown-500 to-brown-700 shadow-xl shadow-brown-500/20 mb-4">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <h1 className="font-heading text-2xl font-semibold text-brown-950">
          {step === "email" ? "Reset Password" : "Check Your Inbox"}
        </h1>
        <p className="text-sm text-beige-600 mt-1">
          {step === "email"
            ? "Enter your email and we'll send you a reset link"
            : `We sent a reset link to ${email}`}
        </p>
      </div>

      <GlassCard variant="heavy" padding="lg">
        <GlassCardContent>

          {/* ── Step 1: Email ── */}
          {step === "email" && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  autoComplete="email"
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Sending…</>
                ) : (
                  <><Send className="w-4 h-4" /> Send Reset Link</>
                )}
              </Button>

              <Link href="/auth/login">
                <Button type="button" variant="ghost" size="sm" className="w-full">
                  <ArrowLeft className="w-4 h-4" /> Back to sign in
                </Button>
              </Link>
            </form>
          )}

          {/* ── Step 2: Email sent ── */}
          {step === "sent" && (
            <div className="space-y-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center">
                <Mail className="w-8 h-8 text-teal-600" />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-beige-600 leading-relaxed">
                  If an account exists for{" "}
                  <span className="font-semibold text-brown-800">{email}</span>,
                  you'll receive a password reset link shortly.
                </p>
                <p className="text-xs text-beige-400">
                  Check your spam folder if you don't see it within a few minutes.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Resend */}
              <div className="flex flex-col items-center gap-2">
                {resendCooldown > 0 ? (
                  <p className="text-sm text-beige-500">
                    Resend available in{" "}
                    <span className="font-semibold text-brown-700">{resendCooldown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isLoading}
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? "Resending…" : "Resend reset link"}
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => router.push("/auth/login")}
                >
                  <CheckCircle className="w-4 h-4" /> Back to Sign In
                </Button>
                <button
                  type="button"
                  onClick={() => { setStep("email"); setError(""); }}
                  className="text-sm text-beige-500 hover:text-brown-700 transition-colors"
                >
                  Use a different email
                </button>
              </div>
            </div>
          )}

        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
