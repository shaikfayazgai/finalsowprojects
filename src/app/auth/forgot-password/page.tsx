"use client";

import * as React from "react";
import Link from "next/link";
import { KeyRound, ArrowRight, ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    // Simulate sending reset email
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="w-full max-w-md animate-fade-up">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-brown-400 to-brown-600 mb-4">
          <KeyRound className="w-6 h-6 text-white" />
        </div>
        <h1 className="font-heading text-[26px] font-semibold text-gray-900">
          {submitted ? "Check your email" : "Reset your password"}
        </h1>
        <p className="text-[13px] text-gray-400 mt-1 max-w-sm mx-auto">
          {submitted
            ? "We've sent a password reset link to your email address"
            : "Enter your email and we'll send you a link to reset your password"
          }
        </p>
      </div>

      {/* Card */}
      <div className="card-parchment p-8">
        {submitted ? (
          /* Success state */
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-forest-50 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-forest-500" />
            </div>
            <p className="text-[13px] text-gray-700 font-medium mb-1">Sent to {email}</p>
            <p className="text-[12px] text-gray-400 mb-6 leading-relaxed">
              Click the link in the email to reset your password. If you don&apos;t see it, check your spam folder.
            </p>
            <button
              onClick={() => { setSubmitted(false); setEmail(""); }}
              className="text-[12px] font-medium text-brown-500 hover:text-brown-600"
            >
              Try a different email
            </button>
          </div>
        ) : (
          /* Form state */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="reset-email" className="text-[12px] font-semibold text-gray-600">Email address</label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., arjun@university.edu.in"
                autoComplete="email"
                required
                className="w-full text-[13px] text-gray-700 bg-white rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all placeholder:text-gray-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className={cn(
                "w-full flex items-center justify-center gap-2 text-[13px] font-semibold px-5 py-3 rounded-xl transition-all",
                email.trim() && !loading
                  ? "text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 shadow-md"
                  : "text-gray-400 bg-gray-100 cursor-not-allowed"
              )}
            >
              {loading ? "Sending..." : "Send reset link"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        )}
      </div>

      {/* Back to login */}
      <div className="mt-5 text-center">
        <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-3 h-3" /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
