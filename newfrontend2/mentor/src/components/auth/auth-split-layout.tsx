"use client";

/**
 * Split-screen auth shell — aurora-gradient brand panel (left) + clean white
 * form panel (right), matching the login page. Collapses to a brand strip +
 * form on mobile. Shared by login, register, forgot-password, MFA, onboarding.
 */

import * as React from "react";
import Link from "next/link";
import { Check, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AURORA_HERO } from "@/app/admin/_shell/aurora";

function AuthBrandLink({ onDark }: { onDark?: boolean }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5", onDark ? "text-white" : "text-foreground")}>
      <span
        className={cn(
          "grid place-items-center h-10 w-10 rounded-xl font-display text-[16px] font-bold",
          onDark ? "bg-white/15 ring-1 ring-white/25 backdrop-blur text-white" : "bg-brand text-on-brand",
        )}
      >
        G
      </span>
      <span className="font-display text-[15.5px] font-semibold tracking-[-0.02em]">GlimmoraTeam</span>
    </Link>
  );
}

/** Slow-drifting aurora glow + contour rings — the brand panel's animated vector. */
function BrandVector() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="anim-orb absolute -top-16 -right-10 h-64 w-64 rounded-full blur-3xl opacity-55" style={{ background: "radial-gradient(circle, rgba(138,99,246,0.9), transparent 70%)" }} />
      <div className="anim-orb-x absolute top-1/3 -left-14 h-56 w-56 rounded-full blur-3xl opacity-40" style={{ background: "radial-gradient(circle, rgba(20,184,200,0.95), transparent 70%)", animationDelay: "-4s" }} />
      <div className="anim-orb absolute -bottom-24 right-1/4 h-72 w-72 rounded-full blur-3xl opacity-35" style={{ background: "radial-gradient(circle, rgba(56,122,246,0.95), transparent 70%)", animationDelay: "-6s" }} />
      <svg className="absolute -right-16 bottom-0 h-[440px] w-[440px] opacity-[0.13]" viewBox="0 0 440 440" fill="none" preserveAspectRatio="xMidYMid meet">
        <g className="anim-orb-x">
          {Array.from({ length: 8 }).map((_, i) => (
            <ellipse key={i} cx="300" cy="300" rx={30 + i * 34} ry={26 + i * 30} stroke="white" strokeOpacity={0.9} strokeWidth="1" />
          ))}
        </g>
      </svg>
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(8,6,20,0.18), transparent 40%, rgba(8,6,20,0.28))" }} />
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 font-body text-[13.5px] text-white/85">
      <span className="grid place-items-center h-6 w-6 rounded-md bg-white/15 ring-1 ring-white/20 shrink-0">
        <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.6} aria-hidden />
      </span>
      {children}
    </li>
  );
}

export function AuthSplitLayout({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative min-h-dvh w-full lg:grid lg:grid-cols-2 xl:grid-cols-[1.05fr_1fr]", className)}>
      {/* ── Brand panel (lg+) ── */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden px-12 py-14 text-white" style={AURORA_HERO}>
        <BrandVector />
        <div className="relative z-10">
          <AuthBrandLink onDark />
        </div>
        <div className="relative z-10 max-w-md">
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55 mb-4">
            AI-Governed Global Workforce
          </p>
          <h2 className="font-display text-[34px] font-bold leading-[1.08] tracking-[-0.03em]">
            Govern global work with confidence.
          </h2>
          <p className="mt-4 font-body text-[14.5px] text-white/70 leading-relaxed">
            Source, decompose, deliver, and pay a worldwide contributor network — with audit-grade oversight at every step.
          </p>
          <ul className="mt-8 space-y-3.5">
            <Feature>Role-based SSO &amp; access control</Feature>
            <Feature>Audit-grade governance &amp; compliance</Feature>
            <Feature>From SOW to payout, end to end</Feature>
          </ul>
        </div>
        <div className="relative z-10 font-body text-[12px] text-white/45">
          © GlimmoraTeam · Trusted by enterprises worldwide
        </div>
      </aside>

      {/* ── Form panel ── */}
      <main className="relative flex flex-col min-h-dvh bg-surface">
        <div className="lg:hidden relative overflow-hidden px-6 pt-9 pb-8 text-white" style={AURORA_HERO}>
          <BrandVector />
          <div className="relative z-10">
            <AuthBrandLink onDark />
            <p className="mt-3 font-body text-[13px] text-white/70 max-w-xs leading-relaxed">
              Govern global work with confidence.
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
      </main>
    </div>
  );
}

export function AuthBrandMark({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center justify-center gap-2.5 text-foreground mx-auto mb-6", className)}>
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-on-brand font-display text-[17px] font-bold shadow-[0_4px_14px_-4px_rgba(58,107,244,0.45)]">
        G
      </span>
      <span className="font-body text-[15px] font-semibold tracking-[-0.02em]">GlimmoraTeam</span>
    </Link>
  );
}

/** Form sits directly on the white panel — no card (matches login). */
export function AuthFormCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("w-full", className)}>{children}</div>;
}

export function AuthCardTitle({ title, subtitle }: { title: string; subtitle?: string; centered?: boolean }) {
  return (
    <header className="mb-6">
      <h1 className="font-display text-[27px] font-bold text-foreground tracking-[-0.03em] leading-none">{title}</h1>
      {subtitle ? <p className="mt-2 font-body text-[14px] text-text-secondary leading-relaxed">{subtitle}</p> : null}
    </header>
  );
}

export function AuthCardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "mt-6 pt-5 border-t border-stroke-subtle text-center font-body text-[13px] text-text-secondary",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Mobile trust strip is replaced by the gradient brand strip in the layout. */
export function AuthMobileTrustStrip() {
  return null;
}

export function AuthOnboardingRailHint() {
  return (
    <div className="mt-6 flex items-center gap-2 rounded-lg border border-stroke-subtle bg-bg-subtle/80 px-3.5 py-2.5">
      <LayoutDashboard className="h-4 w-4 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
      <p className="font-body text-[12px] text-text-secondary">
        Complete onboarding once — your profile carries forward to every task.
      </p>
    </div>
  );
}
