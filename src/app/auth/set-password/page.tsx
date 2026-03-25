"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  Circle,
  Check,
} from "lucide-react";
import {
  GlassCard,
  GlassCardContent,
  Button,
  Input,
  Label,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";

/* ── Password strength rules ── */
const strengthRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function getStrengthScore(password: string): number {
  return strengthRules.filter((r) => r.test(password)).length;
}

const strengthMeta = [
  { label: "Too weak", color: "bg-red-400" },
  { label: "Weak", color: "bg-red-400" },
  { label: "Fair", color: "bg-gold-400" },
  { label: "Good", color: "bg-teal-400" },
  { label: "Strong", color: "bg-forest-500" },
  { label: "Very strong", color: "bg-forest-600" },
];

export default function SetPasswordPage() {
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [errors, setErrors] = React.useState<{ password?: string; confirm?: string }>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const score = getStrengthScore(password);
  const meta = strengthMeta[score];

  const validate = () => {
    const errs: typeof errors = {};
    if (!password) {
      errs.password = "Password is required";
    } else if (score < 3) {
      errs.password = "Password is too weak — meet at least 3 requirements";
    }
    if (!confirm) {
      errs.confirm = "Please confirm your password";
    } else if (password !== confirm) {
      errs.confirm = "Passwords do not match";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      setDone(true);
    }, 800);
  };

  /* ── Success state ── */
  if (done) {
    return (
      <div className="w-full max-w-md">
        <GlassCard variant="heavy" padding="lg">
          <GlassCardContent>
            <div className="text-center space-y-4 py-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-lg shadow-teal-400/25 mx-auto">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-semibold text-brown-950">
                  Password set successfully
                </h2>
                <p className="text-sm text-beige-600 mt-1">
                  Your account is now secured. You can sign in with your new password.
                </p>
              </div>
              <Link href="/auth/login">
                <Button variant="gradient-primary" size="lg" className="w-full mt-2">
                  Continue to Sign In
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    );
  }

  /* ── Set password form ── */
  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brown-500 to-brown-700 shadow-xl shadow-brown-500/20 mb-4">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <h1 className="font-heading text-2xl font-semibold text-brown-950">
          GlimmoraTeam
        </h1>
        <p className="text-sm text-beige-600 mt-1">
          AI-Governed Outcome Delivery Platform
        </p>
      </div>

      <GlassCard variant="heavy" padding="lg">
        <GlassCardContent>
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start gap-3 pb-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shrink-0 shadow-sm">
                <ShieldCheck className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="font-heading text-[16px] font-semibold text-brown-900">
                  Set your new password
                </h2>
                <p className="text-[12px] text-beige-500 mt-0.5">
                  Welcome! For your security, please replace your temporary password before continuing.
                </p>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="sp-password">New Password</Label>
              <div className="relative">
                <Input
                  id="sp-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                  }}
                  className={cn("pr-10", errors.password && "border-red-400")}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-beige-400 hover:text-brown-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {password.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-colors duration-300",
                          i <= score ? meta.color : "bg-beige-200"
                        )}
                      />
                    ))}
                  </div>
                  <p className={cn("text-[11px] font-medium", score < 3 ? "text-red-500" : score < 4 ? "text-gold-600" : "text-teal-600")}>
                    {meta.label}
                  </p>
                </div>
              )}

              {errors.password && (
                <p className="text-[11px] text-red-500 font-medium">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="sp-confirm">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="sp-confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    if (errors.confirm) setErrors((p) => ({ ...p, confirm: undefined }));
                  }}
                  className={cn("pr-10", errors.confirm && "border-red-400")}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-beige-400 hover:text-brown-600 transition-colors"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Match indicator */}
              {confirm.length > 0 && (
                <p className={cn("text-[11px] font-medium flex items-center gap-1", password === confirm ? "text-teal-600" : "text-red-500")}>
                  {password === confirm ? (
                    <><Check className="w-3 h-3" /> Passwords match</>
                  ) : (
                    <><Circle className="w-3 h-3" /> Passwords do not match</>
                  )}
                </p>
              )}
              {errors.confirm && (
                <p className="text-[11px] text-red-500 font-medium">{errors.confirm}</p>
              )}
            </div>

            {/* Requirements checklist */}
            <div className="rounded-xl border border-beige-200/60 bg-beige-50/40 px-4 py-3 space-y-1.5">
              <p className="text-[11px] font-semibold text-beige-500 uppercase tracking-wider mb-2">
                Password requirements
              </p>
              {strengthRules.map((rule) => {
                const passed = rule.test(password);
                return (
                  <div key={rule.label} className="flex items-center gap-2">
                    {passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-beige-300 shrink-0" />
                    )}
                    <span className={cn("text-[12px]", passed ? "text-teal-700 font-medium" : "text-beige-500")}>
                      {rule.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Submit */}
            <Button
              variant="gradient-primary"
              size="lg"
              className="w-full"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Setting password…
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Set New Password
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </>
              )}
            </Button>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Footer */}
      <div className="flex items-center justify-center gap-4 mt-6 text-xs text-beige-500">
        <div className="flex items-center gap-1">
          <Lock className="w-3 h-3" />
          <span>256-bit encryption</span>
        </div>
      </div>
    </div>
  );
}
