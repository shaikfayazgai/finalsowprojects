"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Globe,
  BarChart3,
  Users,
  RefreshCw,
} from "lucide-react";
import { GlassCard, GlassCardContent, Button, Input, Label, Badge } from "@/components/ui";

type Step = "credentials" | "mfa";

const FEATURE_CARDS = [
  { icon: <Globe className="w-4 h-4" />, text: "Operate across 100+ countries from one control layer" },
  { icon: <Shield className="w-4 h-4" />, text: "SOC 2 Type II aligned controls and audit trails" },
  { icon: <BarChart3 className="w-4 h-4" />, text: "Live outcomes, delivery health, and team performance" },
  { icon: <Users className="w-4 h-4" />, text: "Enterprise, contributor, reviewer, and admin governance" },
];

const STATS = [
  { value: "50K+", label: "Contributors" },
  { value: "2,400+", label: "Enterprises" },
  { value: "99.9%", label: "Uptime SLA" },
];

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Enter a valid email address");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }
    setError("");
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsLoading(false);
    setStep("mfa");
  };

  const handleMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }
    setError("");
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsLoading(false);
    router.push("/enterprise/dashboard");
  };

  return (
    <div className="w-full flex items-stretch gap-10 max-w-6xl min-h-140">
      <div className="hidden lg:flex flex-col flex-1 max-w-xl bg-linear-to-br from-stone-900 via-brown-950 to-stone-800 rounded-[2.5rem] p-10 text-white overflow-hidden relative border border-white/10 shadow-2xl">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-brown-700/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-teal-700/20 blur-2xl pointer-events-none" />

        <Link href="/" className="flex items-center gap-2 mb-8 group w-fit">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center group-hover:bg-white/25 transition-colors">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-semibold text-white/90 group-hover:text-white transition-colors">GlimmoraTeam</span>
        </Link>

        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brown-300 mb-3">Enterprise Intelligence</p>
          <h2 className="font-heading text-2xl font-bold text-white leading-snug mb-2">Global Workforce Intelligence Platform</h2>
          <p className="text-sm text-brown-200/90 leading-relaxed">
            AI-governed delivery for distributed teams with measurable outcomes, built-in governance, and trusted scale.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {STATS.map(({ value, label }) => (
            <div key={label} className="bg-white/10 border border-white/10 rounded-xl p-3 text-center">
              <p className="font-heading text-lg font-bold text-white">{value}</p>
              <p className="text-[10px] text-brown-300 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2.5 flex-1">
          {FEATURE_CARDS.map((feature, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-brown-100/90 bg-white/[0.04] border border-white/[0.06]">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-white/10">{feature.icon}</div>
              <p className="text-xs font-medium">{feature.text}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 pt-6 mt-auto border-t border-white/10 text-[10px] text-brown-300">
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>256-bit encryption</span>
          </div>
          <span>|</span>
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            <span>SOC 2 Type II</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md flex flex-col justify-center">
        <div className="text-center mb-7">
          <Link href="/" className="inline-flex items-center gap-2 mb-5 group">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-brown-500 to-brown-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-semibold text-brown-950 group-hover:text-brown-700 transition-colors">GlimmoraTeam</span>
          </Link>
          <h1 className="font-heading text-2xl font-bold text-brown-950">Welcome back</h1>
          <p className="text-sm text-beige-500 mt-1">Sign in to your account to continue</p>
        </div>

        {step === "credentials" && (
          <GlassCard variant="heavy" padding="lg">
            <GlassCardContent>
              <form onSubmit={handleCredentials} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="/auth/forgot-password" className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your secure password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-beige-400 hover:text-beige-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <Button type="submit" variant="gradient-cta" size="lg" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Signing in...
                    </>
                  ) : (
                    <>
                      Sign In <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-beige-600">
                  Don&apos;t have an account?{" "}
                  <Link href="/auth/register" className="text-teal-600 hover:text-teal-700 font-medium">
                    Register
                  </Link>
                </p>
              </form>
            </GlassCardContent>
          </GlassCard>
        )}

        {step === "mfa" && (
          <GlassCard variant="heavy" padding="lg">
            <GlassCardContent>
              <div className="mb-5">
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-brown-500 to-brown-700 flex items-center justify-center mb-4 shadow-lg shadow-brown-200">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <p className="text-[11px] font-semibold text-beige-400 uppercase tracking-widest">Security check</p>
                <p className="font-heading font-semibold text-brown-950 text-lg mt-0.5">Two-Factor Authentication</p>
                <p className="text-xs text-beige-500 mt-1">Enter the 6-digit code from your authenticator app</p>
              </div>

              <form onSubmit={handleMFA} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="mfa">Authenticator Code</Label>
                  <Input
                    id="mfa"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    className="text-center text-2xl tracking-[0.5em] font-mono"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    autoFocus
                  />
                  <p className="text-xs text-beige-400 text-center">Code rotates every 30 seconds, use the current code shown in your app</p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <Button type="submit" variant="gradient-cta" size="lg" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Verifying...
                    </>
                  ) : (
                    <>
                      Verify &amp; Sign In <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("credentials");
                    setMfaCode("");
                    setError("");
                  }}
                  className="w-full flex items-center justify-center gap-1.5 text-sm text-beige-600 hover:text-beige-800 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to login
                </button>
              </form>
            </GlassCardContent>
          </GlassCard>
        )}

        <GlassCard variant="light" padding="md" className="mt-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-[11px] font-semibold text-beige-400 uppercase tracking-widest">Quick Access (Demo)</p>
            <span className="text-[11px] text-beige-400">Sandbox roles</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x w-full">
            <Link href="/enterprise/dashboard" className="shrink-0 snap-start">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center gap-2 rounded-full border-brown-200 bg-white/80 text-brown-800 shadow-sm hover:bg-white"
              >
                <Badge variant="brown" size="sm">E</Badge>
                <span className="text-xs font-semibold tracking-wide">Enterprise</span>
              </Button>
            </Link>
            <Link href="/contributor/dashboard" className="shrink-0 snap-start">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center gap-2 rounded-full border-brown-200 bg-white/80 text-brown-800 shadow-sm hover:bg-white"
              >
                <Badge variant="teal" size="sm">C</Badge>
                <span className="text-xs font-semibold tracking-wide">Contributor</span>
              </Button>
            </Link>
            <Link href="/mentor/dashboard" className="shrink-0 snap-start">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center gap-2 rounded-full border-brown-200 bg-white/80 text-brown-800 shadow-sm hover:bg-white"
              >
                <Badge variant="forest" size="sm">R</Badge>
                <span className="text-xs font-semibold tracking-wide">Reviewer</span>
              </Button>
            </Link>
            <Link href="/enterprise/dashboard?demo=super-admin" className="shrink-0 snap-start">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center gap-2 rounded-full border-brown-200 bg-white/80 text-brown-800 shadow-sm hover:bg-white"
              >
                <Badge variant="brown" size="sm">SA</Badge>
                <span className="text-xs font-semibold tracking-wide">Super Admin</span>
              </Button>
            </Link>
          </div>
        </GlassCard>

        <div className="flex items-center justify-center gap-4 mt-5 text-xs text-beige-400">
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>256-bit encryption</span>
          </div>
          <span>|</span>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span>SOC 2 compliant</span>
          </div>
          <span>|</span>
          <Link href="#" className="hover:text-beige-600 transition-colors">Privacy</Link>
          <span>|</span>
          <Link href="#" className="hover:text-beige-600 transition-colors">Terms</Link>
        </div>
      </div>
    </div>
  );
}
