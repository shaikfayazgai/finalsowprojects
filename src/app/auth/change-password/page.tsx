"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, AlertCircle, CheckCircle2, RefreshCw,
  Lock, Shield, ShieldCheck, KeyRound, Zap, Eye, EyeOff,
} from "lucide-react";
import { Input, Label } from "@/components/ui";

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
  { check: (pw: string) => pw.length >= 8,   text: "At least 8 characters" },
  { check: (pw: string) => /[A-Z]/.test(pw), text: "Uppercase letter" },
  { check: (pw: string) => /[a-z]/.test(pw), text: "Lowercase letter" },
  { check: (pw: string) => /[0-9]/.test(pw), text: "Number" },
];

function getStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8)           score++;
  if (pw.length >= 12)          score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw))  score++;
  if (score <= 1) return { score, label: "Weak",   color: "bg-red-400",  text: "text-red-500" };
  if (score <= 3) return { score, label: "Fair",   color: "bg-gold-400", text: "text-gold-600" };
  return             { score, label: "Strong", color: "bg-teal-500", text: "text-teal-600" };
}

function ChangePasswordContent() {
  const router = useRouter();

  const [accessToken, setAccessToken] = useState<string>("");
  const [email, setEmail]             = useState<string>("");
  const [bootstrapped, setBootstrapped] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords,   setShow]            = useState(false);
  const [isLoading,       setIsLoading]       = useState(false);
  const [error,           setError]           = useState("");
  const [success,         setSuccess]         = useState(false);

  // Load the temporary token + email handed off by the login page.
  // Stored in sessionStorage so it's scoped to this tab and cleared on close.
  useEffect(() => {
    try {
      const tok = sessionStorage.getItem("_first_login_token") ?? "";
      const em  = sessionStorage.getItem("_first_login_email") ?? "";
      setAccessToken(tok);
      setEmail(em);
    } catch {
      /* sessionStorage unavailable */
    }
    setBootstrapped(true);
  }, []);

  if (bootstrapped && !accessToken) {
    return (
      <div className="w-full flex items-start gap-16 max-w-7xl mx-auto px-8">
        <div className="w-full max-w-[440px] mx-auto flex flex-col justify-center pt-8">
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
              <h1 className="font-heading text-[22px] font-bold text-brown-950">Session expired</h1>
              <p className="text-sm text-beige-500 mt-2">
                Please sign in again to change your password.
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
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const strength = getStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) { setError("Please enter your temporary password"); return; }
    if (newPassword.length < 8) { setError("New password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { setError("New password and confirmation do not match"); return; }
    if (newPassword === currentPassword) { setError("New password must be different from your temporary password"); return; }

    setError("");
    setIsLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? "";
      const res = await fetch(`${apiBase}/api/v1/auth/password/change`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          (data as { detail?: string | { message?: string } })?.detail &&
          typeof (data as { detail?: { message?: string } }).detail === "object"
            ? (data as { detail: { message?: string } }).detail.message
            : (data as { detail?: string }).detail;
        if (res.status === 401) {
          setError("Current password is incorrect.");
        } else if (res.status === 403) {
          setError(typeof msg === "string" ? msg : "This account has been deactivated.");
        } else {
          setError(typeof msg === "string" ? msg : "Failed to change password.");
        }
        return;
      }
      setSuccess(true);
      // Sensitive cleanup: discard the temp token + form values.
      try {
        sessionStorage.removeItem("_first_login_token");
        sessionStorage.removeItem("_first_login_email");
      } catch { /* ignore */ }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
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
            First-time Login
          </p>
          <h2 className="font-heading text-4xl font-bold text-brown-950 leading-[1.2] mb-5">
            Change your <span className="text-teal-600">temporary password</span>.
          </h2>
          <p className="text-sm text-beige-600 leading-relaxed max-w-sm">
            For your security, please replace the temporary password we sent
            with a strong password of your choice before signing in.
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

      {/* ── Right form panel ── */}
      <div className="w-full max-w-[440px] flex flex-col justify-center pt-8">

        <Link href="/" className="lg:hidden inline-flex items-center gap-2 mb-6 group">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-brown-500 to-brown-700 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-semibold text-brown-950">GlimmoraTeam</span>
        </Link>

        <AnimatePresence mode="wait">

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
              <div>
                <div className="w-11 h-11 rounded-xl bg-brown-50 border border-brown-100 flex items-center justify-center mb-4">
                  <KeyRound className="w-5 h-5 text-brown-500" />
                </div>
                <h1 className="font-heading text-[22px] font-bold text-brown-950">Change your password</h1>
                <p className="text-sm text-beige-500 mt-1">
                  You&apos;re signing in for the first time. Please set a new password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">

                {email && (
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      readOnly
                      className="h-11 bg-beige-50 cursor-not-allowed"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="currentPassword" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Temporary Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      name="current-password-temp"
                      type={showPasswords ? "text" : "password"}
                      placeholder="The password from your invite email"
                      value={currentPassword}
                      onChange={e => { setCurrentPassword(e.target.value); setError(""); }}
                      className="h-11 pr-10"
                      autoComplete="off"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShow(v => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                      aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
                    >
                      {showPasswords ? <EyeOff className="w-[15px] h-[15px]" /> : <Eye className="w-[15px] h-[15px]" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type={showPasswords ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setError(""); }}
                    className="h-11"
                    autoComplete="new-password"
                  />
                  {newPassword && (
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

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type={showPasswords ? "text" : "password"}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setError(""); }}
                    className="h-11"
                    autoComplete="new-password"
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" /> Passwords do not match
                    </p>
                  )}
                  {confirmPassword && newPassword === confirmPassword && newPassword.length > 0 && (
                    <p className="text-xs text-teal-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 shrink-0" /> Passwords match
                    </p>
                  )}
                </div>

                <div className="rounded-xl bg-beige-50 border border-beige-100 p-4 space-y-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-beige-400 mb-1">
                    Requirements
                  </p>
                  {REQUIREMENTS.map(({ check, text }) => {
                    const met = check(newPassword);
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
                    <><Lock className="w-4 h-4" /> Change Password</>
                  )}
                </button>
              </form>
            </motion.div>
          )}

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
                <h1 className="font-heading text-[22px] font-bold text-brown-950">Password changed!</h1>
                <p className="text-sm text-beige-500 mt-2">
                  Sign in with your new password to continue.
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

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={null}>
      <ChangePasswordContent />
    </Suspense>
  );
}
