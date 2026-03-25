"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Shield, Zap, Lock, KeyRound } from "lucide-react";
import {
  GlassCard,
  GlassCardContent,
  Button,
  Input,
  Label,
  Separator,
  Badge,
} from "@/components/ui";

/* ── Simulated reviewer account (first-login demo) ── */
const DEMO_REVIEWER = {
  email: "reviewer@company.com",
  password: "TempPass1!",
  mustChangePassword: true,
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSignIn = () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    // Simulate auth check
    setTimeout(() => {
      setLoading(false);
      const isReviewer =
        email.trim().toLowerCase() === DEMO_REVIEWER.email &&
        password === DEMO_REVIEWER.password;

      if (isReviewer && DEMO_REVIEWER.mustChangePassword) {
        // First-login flow → redirect to set-password
        router.push("/auth/set-password");
      } else {
        // Default demo: go to enterprise dashboard
        router.push("/enterprise/dashboard");
      }
    }, 600);
  };

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

      {/* Login card */}
      <GlassCard variant="heavy" padding="lg">
        <GlassCardContent>
          <div className="space-y-5">
            {/* SSO Button */}
            <Button variant="gradient-primary" size="lg" className="w-full">
              <Shield className="w-5 h-5" />
              Sign in with SSO
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-beige-500 uppercase tracking-wider">or</span>
              <Separator className="flex-1" />
            </div>

            {/* Email/Password form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="priya@enterprise.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                />
              </div>

              {error && (
                <p className="text-[12px] text-red-500 font-medium">{error}</p>
              )}

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Quick access links for demo */}
      <GlassCard variant="light" padding="md" className="mt-4">
        <p className="text-xs font-semibold text-beige-600 uppercase tracking-wider mb-3">
          Quick Access (Demo)
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/enterprise/dashboard">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Badge variant="brown" size="sm">E</Badge>
              Enterprise
            </Button>
          </Link>
          <Link href="/contributor/dashboard">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Badge variant="teal" size="sm">C</Badge>
              Contributor
            </Button>
          </Link>
          <Link href="/mentor/dashboard">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Badge variant="forest" size="sm">M</Badge>
              Mentor
            </Button>
          </Link>
          <Link href="/analytics/overview">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Badge variant="gold" size="sm">A</Badge>
              Analytics
            </Button>
          </Link>
          {/* Reviewer first-login demo */}
          <Link href="/auth/set-password" className="col-span-2">
            <Button variant="outline" size="sm" className="w-full justify-start border-gold-200 text-gold-700 hover:bg-gold-50">
              <KeyRound className="w-3.5 h-3.5 text-gold-500" />
              Reviewer — First Login (set password)
            </Button>
          </Link>
        </div>
      </GlassCard>

      {/* Footer */}
      <div className="flex items-center justify-center gap-4 mt-6 text-xs text-beige-500">
        <div className="flex items-center gap-1">
          <Lock className="w-3 h-3" />
          <span>256-bit encryption</span>
        </div>
        <span>·</span>
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          <span>SOC 2 compliant</span>
        </div>
      </div>
    </div>
  );
}
