"use client";

/**
 * Login shell — premium split screen.
 * Left: aurora-gradient brand panel (animated vector + value prop).
 * Right: clean white form panel. Collapses to a brand strip + form on mobile.
 */

import * as React from "react";
import Link from "next/link";
import { Check, Mail } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AURORA_HERO } from "@/app/admin/_shell/aurora";

export function LoginBrand({ className, onDark }: { className?: string; onDark?: boolean }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5", onDark ? "text-white" : "text-foreground", className)}>
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

export function LoginShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh w-full lg:grid lg:grid-cols-2 xl:grid-cols-[1.05fr_1fr]">
      {/* ── Brand panel (lg+) ── */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden px-12 py-14 text-white" style={AURORA_HERO}>
        <BrandVector />

        <div className="relative z-10">
          <LoginBrand onDark />
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
        {/* mobile brand strip */}
        <div className="lg:hidden relative overflow-hidden px-6 pt-9 pb-8 text-white" style={AURORA_HERO}>
          <BrandVector />
          <div className="relative z-10">
            <LoginBrand onDark />
            <p className="mt-3 font-body text-[13px] text-white/70 max-w-xs leading-relaxed">
              Govern global work with confidence.
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
      </main>
    </div>
  );
}

export function LoginInviteStrip({ label }: { label: string }) {
  return (
    <div role="status" className="mb-5 flex items-center gap-2.5 rounded-lg border border-info-border bg-info-subtle/40 px-3.5 py-2.5">
      <Mail className="h-4 w-4 shrink-0 text-info-text" strokeWidth={2} aria-hidden />
      <p className="font-body text-[12.5px] text-text-secondary">
        Invited as <span className="font-semibold text-foreground">{label}</span>
      </p>
    </div>
  );
}

export function LoginDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-stroke-subtle" />
      </div>
      <p className="relative flex justify-center">
        <span className="bg-surface px-3 font-body text-[12px] text-text-tertiary">{label}</span>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.28-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.85 14.11A6.59 6.59 0 0 1 5.5 12c0-.73.13-1.44.35-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.67-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.65l3.15-3.15C17.46 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.67 2.84C6.72 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M13 1h10v10H13z" />
      <path fill="#00A4EF" d="M1 13h10v10H1z" />
      <path fill="#FFB900" d="M13 13h10v10H13z" />
    </svg>
  );
}

const OAUTH_BTN = cn(
  "inline-flex h-11 flex-1 min-w-0 items-center justify-center gap-2 rounded-lg border border-stroke-subtle bg-surface",
  "font-body text-[13px] font-semibold text-foreground transition-colors",
  "hover:bg-bg-subtle disabled:opacity-60 disabled:cursor-not-allowed",
);

export function LoginOAuthRow({
  onGoogle,
  onMicrosoft,
  googleBusy,
  microsoftBusy,
  disabled,
}: {
  onGoogle: () => void;
  onMicrosoft: () => void;
  googleBusy?: boolean;
  microsoftBusy?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-2.5">
      <button type="button" onClick={onGoogle} disabled={disabled || googleBusy || microsoftBusy} className={OAUTH_BTN}>
        {googleBusy ? (
          <span className="h-4 w-4 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin" aria-hidden />
        ) : (
          <GoogleIcon />
        )}
        Google
      </button>
      <button type="button" onClick={onMicrosoft} disabled={disabled || googleBusy || microsoftBusy} className={OAUTH_BTN}>
        {microsoftBusy ? (
          <span className="h-4 w-4 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin" aria-hidden />
        ) : (
          <MicrosoftIcon />
        )}
        Microsoft
      </button>
    </div>
  );
}
