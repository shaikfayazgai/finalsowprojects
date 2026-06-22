"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, AlertCircle, Shield, CheckCircle2,
  Globe, Zap, Lock, ArrowRight, RefreshCw,
  Brain, TrendingUp,
} from "lucide-react";
import { authApi, isMfaPending } from "@/lib/api/auth";
import { ApiError, fetchInternal } from "@/lib/api/client";

/**
 * /auth/oauth/callback
 *
 * Landing page after the Glimmora API completes its OAuth flow (Google or
 * Microsoft).  Glimmora redirects here with either:
 *
 *   a) Tokens in query params:
 *      ?access_token=...&refresh_token=...&expires_in=...
 *      &user_id=...&email=...&first_name=...&last_name=...&role=...
 *      &provider=google&state=<base64-encoded { redirectAfter, role }>
 *
 *   b) An authorization code to exchange server-side:
 *      ?code=...&state=...
 *
 * If Glimmora instead redirects with an error:
 *      ?error=...&error_description=...
 */

const SIGN_IN_STEPS = [
  { id: 0, label: "Authenticating with provider",   sublabel: "Verifying OAuth credentials" },
  { id: 1, label: "Validating your identity",        sublabel: "Checking account permissions" },
  { id: 2, label: "Preparing your workspace",        sublabel: "Loading your personalised dashboard" },
];

const PLATFORM_FEATURES = [
  {
    Icon: Brain,
    title: "AI-Governed Delivery",
    desc: "Smart task decomposition and automated quality gates.",
  },
  {
    Icon: Globe,
    title: "Global Talent Network",
    desc: "50,000+ vetted contributors across 80+ countries.",
  },
  {
    Icon: TrendingUp,
    title: "Real-time Analytics",
    desc: "Live governance dashboards and compliance reporting.",
  },
];

const STATS = [
  { value: "50K+",  label: "Contributors" },
  { value: "2,400+", label: "Enterprises" },
  { value: "99.9%", label: "Uptime SLA" },
];

function FloatingOrb({ cx, cy, r, delay, color }: { cx: string; cy: string; r: number; delay: number; color: string }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: cx, top: cy,
        width: r * 2, height: r * 2,
        marginLeft: -r, marginTop: -r,
        background: color,
        filter: "blur(60px)",
      }}
      animate={{ y: [0, -24, 0], x: [0, 12, 0], opacity: [0.35, 0.55, 0.35] }}
      transition={{ duration: 6 + delay, repeat: Infinity, ease: "easeInOut", delay: 0 }}
    />
  );
}

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"processing" | "mfa" | "error">("processing");
  const [errorMsg, setErrorMsg] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

  // MFA state — populated when the OAuth exchange returns mfa_pending
  const mfaPendingTokenRef = useRef("");
  const mfaProviderRef = useRef<"google" | "microsoft">("google");
  const redirectAfterRef = useRef("/auth/redirect");
  const mfaUserRef = useRef<{ id: string; email: string; firstName: string; lastName: string; role: string } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);

  // Animate through steps while processing
  useEffect(() => {
    if (status !== "processing") return;
    const id = setInterval(() => {
      setCurrentStep((s) => Math.min(s + 1, SIGN_IN_STEPS.length - 1));
    }, 1400);
    return () => clearInterval(id);
  }, [status]);

  // TOTP countdown timer (only active during MFA step)
  useEffect(() => {
    if (status !== "mfa") return;
    const tick = () => setTimeLeft(30 - (Math.floor(Date.now() / 1000) % 30));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [status]);

  const createSession = useCallback(async (
    data: {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      user: { id: string; email: string; firstName: string; lastName: string; role: string };
    },
    provider: string,
    redirectAfter: string,
  ) => {
    const result = await signIn("glimmora-oauth", {
      redirect: false,
      accessToken:  data.access_token,
      refreshToken: data.refresh_token ?? "",
      expiresIn:    String(data.expires_in ?? 3600),
      userId:       data.user?.id ?? "",
      email:        data.user?.email ?? "",
      firstName:    data.user?.firstName ?? "",
      lastName:     data.user?.lastName ?? "",
      role:         data.user?.role ?? "enterprise",
      provider,
    });

    if (result?.ok) {
      router.replace(redirectAfter);
    } else {
      setErrorMsg("Sign-in failed after OAuth. Please try again.");
      setStatus("error");
    }
  }, [router]);

  const handleMfaVerify = useCallback(async (code: string) => {
    setMfaLoading(true);
    setMfaError("");
    try {
      const loginData = await authApi.verifyMfaCode(code, mfaPendingTokenRef.current);
      await createSession(
        {
          access_token: loginData.access_token,
          refresh_token: loginData.refresh_token,
          expires_in: loginData.expires_in,
          user: {
            id: loginData.user.id,
            email: loginData.user.email,
            firstName: loginData.user.firstName,
            lastName: loginData.user.lastName,
            role: loginData.user.role,
          },
        },
        mfaProviderRef.current,
        redirectAfterRef.current,
      );
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Invalid code. Please try again.";
      setMfaError(msg);
      setMfaLoading(false);
    }
  }, [createSession]);

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (status === "mfa" && mfaCode.length === 6 && !mfaLoading) {
      handleMfaVerify(mfaCode);
    }
  }, [mfaCode, status, mfaLoading, handleMfaVerify]);

  useEffect(() => {
    async function handleCallback() {
      const error = searchParams.get("error");
      if (error) {
        const desc = searchParams.get("error_description") ?? error;
        const email = searchParams.get("email") ?? "";
        const params = new URLSearchParams({ error, error_description: desc });
        if (email) params.set("email", email);
        router.replace(`/auth/login?${params.toString()}`);
        return;
      }

      // ── Parse state ──────────────────────────────────────────────────────
      let redirectAfter = "/auth/redirect";
      let roleFromState: string = "";
      let providerFromState: "google" | "microsoft" | null = null;
      try {
        const cachedRedirect = sessionStorage.getItem("_oauth_redirect_after");
        const cachedRole = sessionStorage.getItem("_oauth_role");
        const cachedProvider = sessionStorage.getItem("_oauth_provider");
        if (cachedRedirect) redirectAfter = cachedRedirect;
        if (cachedRole) roleFromState = cachedRole;
        if (cachedProvider === "google" || cachedProvider === "microsoft") {
          providerFromState = cachedProvider;
        }
      } catch {
        // ignore storage access issues
      }
      const rawState = searchParams.get("state");
      if (rawState) {
        try {
          const parsed = JSON.parse(atob(rawState));
          if (parsed.redirectAfter) redirectAfter = parsed.redirectAfter;
          if (parsed.role) roleFromState = parsed.role;
          if (parsed.provider === "google" || parsed.provider === "microsoft") {
            providerFromState = parsed.provider;
          }
        } catch {
          // state not our encoded blob — ignore (could be Glimmora's internal state)
        }
      }

      // ── Case A: Glimmora returned tokens directly ─────────────────────
      const accessToken = searchParams.get("access_token");
      if (accessToken) {
        const result = await signIn("glimmora-oauth", {
          redirect: false,
          accessToken,
          refreshToken:  searchParams.get("refresh_token") ?? "",
          expiresIn:     searchParams.get("expires_in") ?? "3600",
          userId:        searchParams.get("user_id") ?? searchParams.get("id") ?? "",
          email:         searchParams.get("email") ?? "",
          firstName:     searchParams.get("first_name") ?? searchParams.get("firstName") ?? "",
          lastName:      searchParams.get("last_name") ?? searchParams.get("lastName") ?? "",
          role:          searchParams.get("role") ?? roleFromState,
          provider:      searchParams.get("provider") ?? "google",
        });

        if (result?.ok) {
          router.replace(redirectAfter);
        } else {
          setErrorMsg("Sign-in failed after OAuth. Please try again.");
          setStatus("error");
        }
        return;
      }

      // ── Case A-MFA: Glimmora returned mfa_pending params directly ────
      const mfaPendingToken = searchParams.get("mfa_pending_token");
      if (mfaPendingToken && searchParams.get("status") === "mfa_pending") {
        const providerParam = searchParams.get("provider") === "microsoft" ? "microsoft" : "google";
        const bypassResult = await signIn("glimmora-oauth", {
          redirect: false,
          accessToken: "",
          refreshToken: "",
          expiresIn: "3600",
          userId: searchParams.get("user_id") ?? "",
          email: searchParams.get("email") ?? "",
          firstName: searchParams.get("first_name") ?? "",
          lastName: searchParams.get("last_name") ?? "",
          role: searchParams.get("role") ?? roleFromState,
          provider: providerParam,
        });
        if (bypassResult?.ok) {
          router.replace(redirectAfter);
        } else {
          setErrorMsg("Could not continue SSO without MFA. Please try again.");
          setStatus("error");
        }
        return;
      }

      // ── Case B: code exchange (server-side) ───────────────────────────
      const code = searchParams.get("code");
      const providerParam = searchParams.get("provider");
      const provider: "google" | "microsoft" =
        providerParam === "microsoft"
          ? "microsoft"
          : providerParam === "google"
            ? "google"
            : providerFromState ?? "google";
      if (code) {
        try {
          const res = await fetchInternal("/api/auth/oauth/exchange", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, provider, state: rawState }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error ?? "Token exchange failed");
          }
          const data = await res.json();

          // MFA required — show inline TOTP form
          if (isMfaPending(data)) {
            const bypassResult = await signIn("glimmora-oauth", {
              redirect: false,
              accessToken: "",
              refreshToken: "",
              expiresIn: "3600",
              userId: data.user.id,
              email: data.user.email,
              firstName: data.user.firstName,
              lastName: data.user.lastName,
              role: data.user?.role || roleFromState,
              provider,
            });
            if (bypassResult?.ok) {
              router.replace(redirectAfter);
            } else {
              setErrorMsg("Could not continue SSO without MFA. Please try again.");
              setStatus("error");
            }
            return;
          }

          await createSession(
            {
              access_token: data.access_token,
              refresh_token: data.refresh_token ?? "",
              expires_in: data.expires_in ?? 3600,
              user: {
                id:        data.user?.id ?? "",
                email:     data.user?.email ?? "",
                firstName: data.user?.firstName ?? "",
                lastName:  data.user?.lastName ?? "",
                role:      data.user?.role ?? roleFromState,
              },
            },
            provider,
            redirectAfter,
          );
        } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
          setStatus("error");
        }
        return;
      }

      // Neither tokens nor code — unexpected
      setErrorMsg("No authentication data received from the provider. Please try again.");
      setStatus("error");
    }

    handleCallback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL ───────────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[54%] relative overflow-hidden px-14 py-12"
        style={{ background: "linear-gradient(145deg, #1C0F09 0%, #2C1810 45%, #1A2520 100%)" }}
      >
        {/* Decorative orbs */}
        <FloatingOrb cx="15%" cy="20%" r={200} delay={0}   color="rgba(166,119,99,0.6)" />
        <FloatingOrb cx="78%" cy="62%" r={240} delay={2.2} color="rgba(13,148,136,0.45)" />
        <FloatingOrb cx="42%" cy="85%" r={150} delay={1.0} color="rgba(107,61,46,0.5)" />
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 50% at 20% 25%, rgba(166,119,99,0.18) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 75% 70%, rgba(13,148,136,0.14) 0%, transparent 70%)",
          }}
        />
        {/* Subtle grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex items-center gap-3 relative z-10"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg, #A67763, #886151)" }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-white text-lg tracking-tight">GlimmoraTeam</span>
        </motion.div>

        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
          className="relative z-10 space-y-5"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] flex items-center gap-2"
            style={{ color: "#5EEAD4" }}>
            <span className="w-6 h-px bg-teal-400 opacity-70" />
            AI-Governed Workforce
          </p>
          <h2 className="font-heading text-5xl font-bold leading-[1.1] text-white">
            Your workspace<br />
            <span style={{ color: "#A67763" }}>is ready</span> for<br />
            you.
          </h2>
          <p className="text-sm leading-relaxed max-w-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            Intelligent delivery infrastructure for distributed teams — from scoping to sign-off.
          </p>

          {/* Features */}
          <div className="space-y-3 pt-2">
            {PLATFORM_FEATURES.map(({ Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + i * 0.07, ease: "easeOut" }}
                className="flex items-start gap-3.5 group"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "rgba(166,119,99,0.18)", border: "1px solid rgba(166,119,99,0.25)" }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: "#A67763" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/90">{title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.42)" }}>{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12, ease: "easeOut" }}
          className="relative z-10 flex items-center gap-8 pt-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          {STATS.map(({ value, label }, i) => (
            <div key={label} className={i > 0 ? "pl-8 border-l border-white/10" : ""}>
              <p className="font-heading text-2xl font-bold text-white">{value}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            <Lock className="w-3 h-3" />
            SOC 2 · ISO 27001
          </div>
        </motion.div>
      </div>

      {/* ── RIGHT PANEL ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 relative"
        style={{ background: "#FAF8F5" }}>

        {/* Mobile logo */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="lg:hidden absolute top-8 left-8 flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #A67763, #886151)" }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-brown-950 text-base">GlimmoraTeam</span>
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ── PROCESSING ───────────────────────────────────────────── */}
          {status === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full max-w-sm space-y-10"
            >
              {/* Animated icon */}
              <div className="flex flex-col items-center gap-5">
                <div className="relative flex items-center justify-center w-16 h-16">
                  {/* Pulsing rings — sized explicitly so they expand outward */}
                  <motion.div
                    className="absolute rounded-2xl"
                    style={{ width: 64, height: 64, background: "rgba(166,119,99,0.2)" }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                  />
                  <motion.div
                    className="absolute rounded-2xl"
                    style={{ width: 64, height: 64, background: "rgba(166,119,99,0.12)" }}
                    animate={{ scale: [1, 1.9, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: 0.55 }}
                  />
                  <motion.div
                    className="relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl z-10"
                    style={{ background: "linear-gradient(135deg, #A67763, #6B3D2E)" }}
                    animate={{ rotate: [0, 4, -4, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Sparkles className="w-7 h-7 text-white" />
                  </motion.div>
                </div>

                <div className="text-center">
                  <motion.p
                    className="font-heading text-2xl font-bold text-brown-950"
                    animate={{ opacity: [0.85, 1, 0.85] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    Signing you in…
                  </motion.p>
                  <p className="text-sm mt-1.5" style={{ color: "#A89880" }}>
                    Hang tight, this only takes a moment.
                  </p>
                </div>
              </div>

              {/* Progress steps */}
              <div
                className="rounded-2xl p-6 space-y-4"
                style={{
                  background: "rgba(255,255,255,0.85)",
                  border: "1px solid rgba(0,0,0,0.06)",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.05)",
                }}
              >
                {SIGN_IN_STEPS.map((step, i) => {
                  const isDone    = i < currentStep;
                  const isActive  = i === currentStep;
                  const isPending = i > currentStep;
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.06 }}
                      className="flex items-center gap-4"
                    >
                      {/* Step icon */}
                      <div className="relative w-8 h-8 shrink-0 flex items-center justify-center rounded-full">
                        {isDone && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ background: "rgba(13,148,136,0.12)" }}
                          >
                            <CheckCircle2 className="w-4 h-4 text-teal-600" />
                          </motion.div>
                        )}
                        {isActive && (
                          <motion.div
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ background: "rgba(166,119,99,0.12)" }}
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                          >
                            <motion.div
                              className="w-3.5 h-3.5 rounded-full"
                              style={{ background: "#A67763" }}
                              animate={{ opacity: [1, 0.4, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                          </motion.div>
                        )}
                        {isPending && (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ background: "rgba(0,0,0,0.04)" }}>
                            <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Step text */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold transition-colors ${
                          isDone ? "text-teal-700" : isActive ? "text-brown-950" : "text-gray-400"
                        }`}>
                          {step.label}
                        </p>
                        <p className={`text-xs mt-0.5 transition-colors ${
                          isActive ? "text-beige-500" : "text-gray-300"
                        }`}>
                          {step.sublabel}
                        </p>
                      </div>

                      {/* Status badge */}
                      <div>
                        {isDone && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(13,148,136,0.1)", color: "#0D9488" }}
                          >
                            Done
                          </motion.span>
                        )}
                        {isActive && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(166,119,99,0.1)", color: "#A67763" }}>
                            In progress
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {/* Animated progress bar */}
                <div className="h-1 rounded-full bg-gray-100 overflow-hidden mt-2">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #A67763, #0D9488)" }}
                    initial={{ width: "5%" }}
                    animate={{ width: `${((currentStep + 0.6) / SIGN_IN_STEPS.length) * 100}%` }}
                    transition={{ duration: 0.9, ease: "easeInOut" }}
                  />
                </div>
              </div>

              {/* Security badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="flex items-center justify-center gap-5 text-xs"
                style={{ color: "#C4AFA4" }}
              >
                {[
                  { Icon: Lock,  label: "256-bit TLS" },
                  { Icon: Shield, label: "SOC 2 Type II" },
                  { Icon: Zap,   label: "Zero-trust" },
                ].map(({ Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <Icon className="w-3 h-3" />
                    {label}
                  </div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* ── MFA ──────────────────────────────────────────────────── */}
          {status === "mfa" && (
            <motion.div
              key="mfa"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full max-w-sm"
            >
              <div
                className="rounded-2xl p-8 space-y-6"
                style={{
                  background: "rgba(255,255,255,0.92)",
                  border: "1px solid rgba(0,0,0,0.06)",
                  boxShadow: "0 8px 40px rgba(0,0,0,0.07)",
                }}
              >
                {/* Header */}
                <div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-md"
                    style={{ background: "linear-gradient(135deg, #A67763, #886151)" }}>
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="font-heading text-xl font-bold text-brown-950">Two-Factor Authentication</h2>
                  <p className="text-sm mt-1.5" style={{ color: "#A89880" }}>
                    Enter the 6-digit code from your authenticator app to complete sign-in.
                  </p>
                </div>

                {/* Code input */}
                <div className="space-y-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000 000"
                    autoFocus
                    disabled={mfaLoading}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full text-center text-3xl tracking-[0.6em] font-mono rounded-xl px-4 py-3.5 transition-all disabled:opacity-50 focus:outline-none"
                    style={{
                      background: "#F7F4F0",
                      border: "1.5px solid rgba(0,0,0,0.08)",
                      color: "#2C1810",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#A67763"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(166,119,99,0.12)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
                  />

                  {/* TOTP timer */}
                  <div className="space-y-1.5">
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: timeLeft > 10 ? "#0D9488" : "#EF4444" }}
                        animate={{ width: `${(timeLeft / 30) * 100}%` }}
                        transition={{ duration: 1, ease: "linear" }}
                      />
                    </div>
                    <p className="text-[11px] text-center" style={{ color: "#A89880" }}>
                      Code refreshes in{" "}
                      <span className="font-mono font-semibold" style={{ color: timeLeft > 10 ? "#0D9488" : "#EF4444" }}>
                        {timeLeft}s
                      </span>
                    </p>
                  </div>
                </div>

                <AnimatePresence>
                  {mfaError && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
                      style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", color: "#DC2626" }}
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {mfaError}
                    </motion.div>
                  )}
                </AnimatePresence>

                {mfaLoading && (
                  <div className="flex items-center justify-center gap-2 py-1 text-sm" style={{ color: "#A89880" }}>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Verifying your code…
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => router.replace("/auth/login")}
                  className="w-full text-sm font-medium transition-colors text-center pt-1"
                  style={{ color: "#C4AFA4" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#6B3D2E"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#C4AFA4"; }}
                >
                  ← Back to login
                </button>
              </div>
            </motion.div>
          )}

          {/* ── ERROR ────────────────────────────────────────────────── */}
          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full max-w-sm"
            >
              <div
                className="rounded-2xl p-8 space-y-6 text-center"
                style={{
                  background: "rgba(255,255,255,0.92)",
                  border: "1px solid rgba(0,0,0,0.06)",
                  boxShadow: "0 8px 40px rgba(0,0,0,0.07)",
                }}
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.1 }}
                  className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}
                >
                  <AlertCircle className="w-7 h-7 text-red-500" />
                </motion.div>

                <div>
                  <h2 className="font-heading text-xl font-bold text-brown-950">Sign-in failed</h2>
                  <p className="text-sm mt-2 leading-relaxed" style={{ color: "#A89880" }}>{errorMsg}</p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => router.replace("/auth/login")}
                    className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all"
                    style={{ background: "linear-gradient(135deg, #A67763, #886151)", boxShadow: "0 2px 12px rgba(166,119,99,0.35)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(166,119,99,0.45)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(166,119,99,0.35)"; }}
                  >
                    Try Again <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-xs" style={{ color: "#C4AFA4" }}>
                    If the issue persists, please contact{" "}
                    <a href="mailto:support@glimmora.ai" className="underline hover:text-brown-600 transition-colors">
                      support@glimmora.ai
                    </a>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAF8F5" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg, #A67763, #886151)" }}>
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <RefreshCw className="w-5 h-5 animate-spin" style={{ color: "#A67763" }} />
        </div>
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
}
