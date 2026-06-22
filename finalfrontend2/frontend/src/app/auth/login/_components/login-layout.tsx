"use client";

/**
 * Login shell — centered card on mesh canvas. Brand above, form inside card.
 */

import * as React from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, MESH_CANVAS } from "@/app/admin/_shell/aurora";

export function LoginBrand({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2.5 text-foreground", className)}
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-on-brand font-display text-[16px] font-bold">
        G
      </span>
      <span className="font-body text-[15px] font-semibold tracking-[-0.02em]">GlimmoraTeam</span>
    </Link>
  );
}

export function LoginShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh flex flex-col">
      <div aria-hidden className="fixed inset-0 -z-10" style={MESH_CANVAS} />

      <header className="flex justify-center px-5 pt-10 pb-2">
        <LoginBrand />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-5 pb-10">
        <div className={cn(DASH_CARD, "w-full max-w-[420px] px-6 py-8 sm:px-8")}>{children}</div>
      </main>
    </div>
  );
}

export function LoginInviteStrip({ label }: { label: string }) {
  return (
    <div
      role="status"
      className="mb-5 flex items-center gap-2.5 rounded-lg border border-info-border bg-info-subtle/40 px-3.5 py-2.5"
    >
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
      <button
        type="button"
        onClick={onGoogle}
        disabled={disabled || googleBusy || microsoftBusy}
        className={OAUTH_BTN}
      >
        {googleBusy ? (
          <span className="h-4 w-4 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin" aria-hidden />
        ) : (
          <GoogleIcon />
        )}
        Google
      </button>
      <button
        type="button"
        onClick={onMicrosoft}
        disabled={disabled || googleBusy || microsoftBusy}
        className={OAUTH_BTN}
      >
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
