"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Shield,
  Lock,
  Zap,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
  KeyRound,
  Star,
} from "lucide-react";
import { GlassCard, GlassCardContent, Button, Input, Label, Badge } from "@/components/ui";
import { useAuthStore } from "@/lib/stores/auth-store";
import { loginSchema } from "@/lib/validations/login";

type Step = "credentials" | "mfa-prompt" | "mfa" | "recovery";

const STATS = [
  { value: "50K+", label: "Contributors" },
  { value: "2,400+", label: "Enterprises" },
  { value: "99.9%", label: "Uptime SLA" },
];

function LoginPageContent() {
  const searchParams = useSearchParams();
  const isMfaEnabled = useAuthStore((s) => s.isMfaEnabled);

  const rawCallbackUrl = searchParams.get("callbackUrl");
  const callbackUrl = (() => {
    if (!rawCallbackUrl) return undefined;
    try {
      const url = new URL(rawCallbackUrl, window.location.origin);
      // Only allow same-origin redirects to avoid open-redirects
      if (url.origin !== window.location.origin) return undefined;
      // Do not redirect back to the home page after login
      if (url.pathname === "/" && !url.search && !url.hash) return undefined;
      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return undefined;
    }
  })();

  // Destination computed once after successful login and stored for sync use
  const [loginDest, setLoginDest] = useState<string>("");

  const [step, setStep] = useState<Step>("credentials");
  const [userRole, setUserRole] = useState<string>("");
  const mfaPendingTokenRef = useRef<string>("");

  const redirectTo = callbackUrl || (
    userRole === "contributor" ? "/contributor/dashboard" :
    userRole === "mentor"      ? "/mentor/dashboard" :
    userRole === "admin"       ? "/admin/dashboard" :
                                 "/enterprise/dashboard"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<"google" | "microsoft" | null>(null);
  const [error, setError] = useState("");

  // Reset ssoLoading when page is restored from bfcache (user pressed Back after being
  // redirected to the OAuth provider without completing sign-in).
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setSsoLoading(null);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);
  const [errorCode, setErrorCode] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [timeLeft, setTimeLeft] = useState(30);

  // Show error from URL params (e.g., OAuth errors)
  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) {
      switch (urlError) {
        case "OAuthAccountNotLinked":
          setError("This email is already associated with another sign-in method. Please use your original sign-in method to continue.");
          break;
        case "OAuthCallbackError":
          setError("We were unable to complete the sign-in with your provider. Please try again or use a different method.");
          break;
        case "AccessDenied":
          setError("Access denied. Your account may not have the required permissions. Please contact your administrator.");
          break;
        case "CredentialsSignin":
          setError("The email or password you entered is incorrect. Please verify your credentials and try again.");
          break;
        case "SsoNotRegistered":
          setError("No account found for this Google/Microsoft login. Please register first.");
          setErrorCode("NO_ACCOUNT");
          break;
        default:
          setError("Something went wrong on our end. Please try again shortly or contact support if the issue persists.");
      }
    }
  }, [searchParams]);

  /* ── TOTP countdown timer ── */
  useEffect(() => {
    if (step !== "mfa") return;
    const tick = () => {
      setTimeLeft(30 - (Math.floor(Date.now() / 1000) % 30));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [step]);

  /* ── Verify TOTP code via Glimmora API ── */
  const handleMFA = useCallback(async () => {
    setError("");
    setIsLoading(true);
    try {
      await authApi.verifyMfaCode(mfaCode, mfaPendingTokenRef.current);
      // MFA verified — refresh the NextAuth session to pick up the new token state
      await getSession();
      window.location.href = loginDest || callbackUrl || "/enterprise/dashboard";
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Invalid code. Please try again.";
      setError(msg);
      setIsLoading(false);
    }
  }, [mfaCode, loginDest, callbackUrl]);

  useEffect(() => {
    if (step === "mfa" && mfaCode.length === 6 && !isLoading) {
      handleMFA();
    }
  }, [mfaCode, step, isLoading, handleMFA]);

  /* ── Email + Password login via NextAuth Credentials ── */
  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setErrorCode("");
    setFieldErrors({});

    const result = loginSchema.safeParse({ email: email.trim(), password });
    if (!result.success) {
      const errors: { email?: string; password?: string } = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as "email" | "password";
        if (!errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    setErrorCode("");

    try {
      // Pre-validate credentials to get specific error messages
      const validateRes = await fetch("/api/auth/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      if (!validateRes.ok) {
        const data = await validateRes.json();
        setError(data.message);
        setErrorCode(data.error);
        setIsLoading(false);
        return;
      }

      const validateData = await validateRes.json();

      // MFA required — skip signIn, store the pending token and show TOTP step
      if (validateData.mfaRequired) {
        mfaPendingTokenRef.current = validateData.mfaPendingToken ?? "";
        setStep("mfa");
        setIsLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Something went wrong. Please try again.");
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        const session = await getSession();
        const role = (session?.user as { role?: string })?.role;

        setUserRole(role || "enterprise");

        // Login = returning user — send straight to dashboard.
        // Onboarding wizard is only for first-time SSO users (handled in auth.ts signIn callback).
        const dest = callbackUrl || (
          role === "contributor" ? "/contributor/dashboard" :
          role === "mentor"      ? "/mentor/dashboard" :
          role === "admin"       ? "/admin/dashboard" :
                                   "/enterprise/dashboard"
        );
        setLoginDest(dest);

        // Admin role skips MFA prompt — navigate directly to dashboard.
        if (role === "admin") {
          window.location.href = dest;
          return;
        }

        setStep("mfa-prompt");
        setIsLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleMFASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.length !== 6) { setError("Please enter the 6-digit code"); return; }
    await handleMFA();
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryCode) { setError("Please enter your recovery code"); return; }
    setError("");
    setIsLoading(true);
    try {
      await authApi.redeemRecoveryCode(recoveryCode, mfaPendingTokenRef.current);
      await getSession();
      window.location.href = loginDest || callbackUrl || "/enterprise/dashboard";
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Invalid recovery code. Please try again.";
      setError(msg);
      setIsLoading(false);
    }
  };

  /* ── Google / Microsoft SSO via Glimmora OAuth API ── */
  const handleSSO = (provider: "google" | "microsoft") => {
    setError("");
    setSsoLoading(provider);
    // Fall back to /auth/redirect which reads the session role and routes accordingly
    const redirectAfter = callbackUrl || "/auth/redirect";
    // Use NextAuth's built-in OAuth instead of Glimmora's endpoints
    // Glimmora's callback is locked to glimmora-api.onrender.com and can't redirect back
    signIn(provider, { callbackUrl: redirectAfter });
  };

  const resetToCredentials = () => {
    setStep("credentials");
    setMfaCode("");
    setRecoveryCode("");
    setError("");
    setErrorCode("");
    setFieldErrors({});
  };

  return (
    <div className="w-full flex items-start gap-16 max-w-7xl mx-auto px-8">

      {/* ── Left content (no box) ── */}
      <div className="hidden lg:flex flex-col flex-1 max-w-lg pt-8 pb-8 pr-10 gap-14">

        {/* TOP — Branding + Headline */}
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
            Enterprise Intelligence
          </p>

          <h2 className="font-heading text-4xl font-bold text-brown-950 leading-[1.2] mb-5">
            Welcome back to<br />
            <span className="text-teal-600">your workspace</span>.
          </h2>

          <p className="text-sm text-beige-600 leading-relaxed max-w-sm">
            AI-governed delivery for distributed teams at trusted scale.
            Sign in to manage your workforce, projects, and earnings.
          </p>
        </div>

        {/* MIDDLE — Stats + Badges */}
        <div>
          <div className="flex items-center gap-8 mb-8">
            {STATS.map(({ value, label }, i) => (
              <div key={label} className={`${i > 0 ? "pl-8 border-l border-beige-200" : ""}`}>
                <p className="font-heading text-2xl font-bold text-brown-950">{value}</p>
                <p className="text-xs text-beige-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              { Icon: Shield, label: "SOC 2 Certified" },
              { Icon: Lock, label: "256-bit Encryption" },
              { Icon: Zap, label: "99.9% Uptime SLA" },
              { Icon: ArrowRight, label: "GDPR Compliant" },
            ].map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/50 border border-beige-100">
                <Icon className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="text-xs text-brown-700 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Form panel (right) ── */}
      <div className="w-full max-w-[440px] flex flex-col justify-center">

        {/* Mobile logo */}
        <Link href="/" className="lg:hidden inline-flex items-center gap-2 mb-6 group">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-brown-500 to-brown-700 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-semibold text-brown-950 group-hover:text-brown-700 transition-colors">
            GlimmoraTeam
          </span>
        </Link>

        {/* ── Step: credentials ── */}
        {step === "credentials" && (
          <div
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
              <h1 className="font-heading text-[22px] font-bold text-brown-950">Sign in to your account</h1>
              <p className="text-sm text-beige-500 mt-1">Enter your credentials to continue</p>
            </div>

            {/* SSO buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSSO("google")}
                disabled={!!ssoLoading}
                className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-sm font-medium text-gray-700 disabled:opacity-50"
              >
                {ssoLoading === "google" ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                Google
              </button>
              <button
                type="button"
                onClick={() => handleSSO("microsoft")}
                disabled={!!ssoLoading}
                className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-sm font-medium text-gray-700 disabled:opacity-50"
              >
                {ssoLoading === "microsoft" ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <rect fill="#F25022" x="1" y="1" width="10" height="10" />
                    <rect fill="#7FBA00" x="13" y="1" width="10" height="10" />
                    <rect fill="#00A4EF" x="1" y="13" width="10" height="10" />
                    <rect fill="#FFB900" x="13" y="13" width="10" height="10" />
                  </svg>
                )}
                Microsoft
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Form */}
            <form onSubmit={handleCredentials} className="space-y-5">
              <AnimatePresence>
                {error && (
                  <motion.div
                    key="login-error"
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p>{error}</p>
                      {errorCode === "NO_ACCOUNT" && (
                        <Link
                          href="/auth/register"
                          className="inline-flex items-center gap-1 mt-1.5 text-teal-600 hover:text-teal-700 font-semibold transition-colors"
                        >
                          Create an account <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFieldErrors((prev) => ({ ...prev, email: undefined })); }}
                  className={fieldErrors.email ? "border-red-400 focus:ring-red-400/20" : ""}
                  autoFocus
                />
                {fieldErrors.email && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setFieldErrors((prev) => ({ ...prev, password: undefined })); }}
                    className={`pr-10 ${fieldErrors.password ? "border-red-400 focus:ring-red-400/20" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-[15px] h-[15px]" /> : <Eye className="w-[15px] h-[15px]" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-brown-700 accent-brown-700 focus:ring-brown-700/20 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <Link href="/auth/forgot-password" className="text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" variant="gradient-cta" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Signing in...</>
                ) : (
                  <>Sign In <ArrowRight className="w-4 h-4" /></>
                )}
              </Button>
            </form>

            {/* Register link */}
            <p className="text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="text-teal-600 hover:text-teal-700 font-semibold transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        )}

        {/* ── Step: mfa-prompt (MFA not yet set up) ── */}
        {step === "mfa-prompt" && (
          <div
            className="rounded-2xl p-8"
            style={{
              background: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(0, 0, 0, 0.06)",
              boxShadow: "0 4px 32px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div className="text-center space-y-5">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-linear-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-200">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="font-heading font-semibold text-brown-950 text-lg">Secure Your Account</p>
                <p className="text-sm text-gray-500 mt-1">
                  Enable two-factor authentication for stronger protection.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-teal-50 border border-teal-100 text-left space-y-2.5">
                {[
                  "Protects against password breaches",
                  "Required for enterprise admin roles",
                  "Takes less than 2 minutes to set up",
                ].map((point) => (
                  <div key={point} className="flex items-center gap-2.5 text-sm text-teal-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                    {point}
                  </div>
                ))}
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => { const dest = loginDest || callbackUrl || "/enterprise/dashboard"; window.location.href = `/auth/mfa-setup?redirect=${dest}`; }}
              >
                <Shield className="w-4 h-4" /> Set Up MFA Now
              </Button>

              <button
                type="button"
                onClick={() => { window.location.href = loginDest || callbackUrl || "/enterprise/dashboard"; }}
                className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
              >
                Skip for now
              </button>

              <button
                type="button"
                onClick={resetToCredentials}
                className="flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors w-full"
              >
                <ArrowLeft className="w-3 h-3" /> Back to login
              </button>
            </div>
          </div>
        )}

        {/* ── Step: mfa (verify 6-digit code) ── */}
        {step === "mfa" && (
          <div
            className="rounded-2xl p-8"
            style={{
              background: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(0, 0, 0, 0.06)",
              boxShadow: "0 4px 32px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div className="mb-6">
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-brown-500 to-brown-700 flex items-center justify-center mb-4 shadow-lg shadow-brown-200">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Security check</p>
              <p className="font-heading font-semibold text-brown-950 text-lg mt-0.5">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500 mt-1">Enter the 6-digit code from your authenticator app</p>
            </div>

            <form onSubmit={handleMFASubmit} className="space-y-5">
              <div className="space-y-3">
                <Label htmlFor="mfa">Authenticator Code</Label>
                <Input
                  id="mfa"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  autoFocus
                />

                <div className="space-y-1">
                  <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 bg-teal-500"
                      style={{ width: `${(timeLeft / 30) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 text-center">
                    Code expires in <span className="font-mono font-semibold text-brown-700">{timeLeft}s</span>
                  </p>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    key="mfa-error"
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {isLoading && (
                <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-500">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying...
                </div>
              )}

              {!isLoading && mfaCode.length < 6 && (
                <Button type="submit" variant="gradient-cta" size="lg" className="w-full" disabled={mfaCode.length !== 6}>
                  Verify &amp; Sign In <ArrowRight className="w-4 h-4" />
                </Button>
              )}

              <div className="space-y-2 text-center">
                <button
                  type="button"
                  onClick={() => { setStep("recovery"); setError(""); }}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
                >
                  Use a recovery code instead
                </button>
                <br />
                <button
                  type="button"
                  onClick={resetToCredentials}
                  className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors w-full"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to login
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Step: recovery code ── */}
        {step === "recovery" && (
          <div
            className="rounded-2xl p-8"
            style={{
              background: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(0, 0, 0, 0.06)",
              boxShadow: "0 4px 32px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div className="mb-6">
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-brown-400 to-brown-600 flex items-center justify-center mb-4">
                <KeyRound className="w-6 h-6 text-white" />
              </div>
              <p className="font-heading font-semibold text-brown-950 text-lg">Recovery Code</p>
              <p className="text-sm text-gray-500 mt-1">
                Enter one of your 8-character backup codes saved during MFA setup.
              </p>
            </div>

            <form onSubmit={handleRecovery} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="recovery">Backup Recovery Code</Label>
                <Input
                  id="recovery"
                  type="text"
                  placeholder="XXXXX-XXXXX"
                  className="text-center font-mono tracking-widest uppercase"
                  value={recoveryCode}
                  onChange={(e) =>
                    setRecoveryCode(
                      e.target.value
                        .replace(/[^A-Za-z0-9-]/g, "")
                        .toUpperCase()
                        .slice(0, 11)
                    )
                  }
                  autoFocus
                />
                <p className="text-xs text-gray-400 text-center">Format: XXXXX-XXXXX</p>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    key="recovery-error"
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <Button type="submit" variant="gradient-cta" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Verifying...</>
                ) : (
                  <>Verify Recovery Code <ArrowRight className="w-4 h-4" /></>
                )}
              </Button>

              <button
                type="button"
                onClick={() => { setStep("mfa"); setError(""); }}
                className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors w-full"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to authenticator code
              </button>
            </form>
          </div>
        )}

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
