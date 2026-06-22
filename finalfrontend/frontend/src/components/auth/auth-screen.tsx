"use client";

/**
 * Shared auth shell — split-screen layout + form primitives (Meridian).
 */

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { BTN_PRIMARY } from "@/app/admin/_shell/aurora";
import {
  AuthCardFooter,
  AuthCardTitle,
  AuthFormCard,
  AuthMobileTrustStrip,
  AuthSplitLayout,
} from "@/components/auth/auth-split-layout";

export const authInputCls = cn(
  "block w-full h-11 px-3.5 rounded-lg border border-stroke-subtle bg-surface",
  "font-body text-[14px] text-foreground placeholder:text-text-disabled",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
);

export function AuthScreen({
  title,
  subtitle,
  footer,
  leading,
  children,
}: {
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  leading?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <AuthSplitLayout>
      <AuthFormCard>
        {leading}
        <AuthCardTitle title={title} subtitle={subtitle} />
        {children}
        {footer ? <AuthCardFooter>{footer}</AuthCardFooter> : null}
      </AuthFormCard>
      <AuthMobileTrustStrip />
    </AuthSplitLayout>
  );
}

export function AuthHeaderLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="font-semibold text-text-link hover:underline underline-offset-2">
      {children}
    </Link>
  );
}

export function AuthDivider({ label = "OR" }: { label?: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-stroke-subtle" />
      </div>
      <p className="relative flex justify-center">
        <span className="bg-surface px-3 font-body text-[11px] font-medium uppercase tracking-[0.08em] text-text-tertiary">
          {label}
        </span>
      </p>
    </div>
  );
}

export function AuthField({
  label,
  htmlFor,
  labelExtra,
  children,
}: {
  label: string;
  htmlFor: string;
  labelExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="block">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <label htmlFor={htmlFor} className="font-body text-[13px] font-medium text-foreground">
          {label}
        </label>
        {labelExtra}
      </div>
      {children}
    </div>
  );
}

export function AuthSubmitButton({
  children,
  disabled,
  loading,
  type = "submit",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
}) {
  const active = !disabled && !loading;
  return (
    <button
      type={type}
      disabled={!active}
      style={active ? BTN_PRIMARY : undefined}
      className={cn(
        "w-full h-11 rounded-lg font-body text-[14px] font-semibold transition-opacity mt-1",
        active ? "text-on-brand hover:opacity-90" : "bg-bg-subtle text-text-disabled cursor-not-allowed border border-stroke-subtle",
      )}
    >
      {loading ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span
            className="inline-block h-4 w-4 rounded-full border-2 border-on-brand/40 border-t-on-brand animate-spin"
            aria-hidden
          />
          Working…
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export function AuthAlert({
  variant,
  children,
}: {
  variant: "error" | "success" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    error: "border-error-border bg-error-subtle/60 text-error-text",
    success: "border-success-border bg-success-subtle/60 text-success-text",
    info: "border-stroke-subtle bg-bg-subtle/80 text-text-secondary",
  }[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn("rounded-lg border px-3.5 py-2.5 font-body text-[13px] mb-4 leading-relaxed", styles)}
    >
      {children}
    </div>
  );
}

export function AuthBackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 font-body text-[13px] font-semibold text-text-link hover:underline underline-offset-2 mt-5"
    >
      {children}
    </Link>
  );
}

export function AuthLegalFooter() {
  return (
    <p className="font-body text-[11.5px] text-text-tertiary mt-5 text-center leading-relaxed">
      By continuing you agree to our{" "}
      <Link href="/legal/terms" className="underline underline-offset-2 hover:text-foreground">
        Terms
      </Link>{" "}
      and{" "}
      <Link href="/legal/privacy" className="underline underline-offset-2 hover:text-foreground">
        Privacy Policy
      </Link>
      .
    </p>
  );
}

export function OAuthButtonStack({
  onGoogle,
  onMicrosoft,
  googleBusy,
  microsoftBusy,
  disabled,
  googleLabel = "Sign in with Google",
  microsoftLabel = "Sign in with Microsoft",
}: {
  onGoogle: () => void;
  onMicrosoft: () => void;
  googleBusy?: boolean;
  microsoftBusy?: boolean;
  disabled?: boolean;
  googleLabel?: string;
  microsoftLabel?: string;
}) {
  return (
    <div className="space-y-2.5">
      <OAuthButton
        provider="google"
        label={googleLabel}
        onClick={onGoogle}
        busy={!!googleBusy}
        disabled={!!disabled}
        fullWidth
      />
      <OAuthButton
        provider="microsoft"
        label={microsoftLabel}
        onClick={onMicrosoft}
        busy={!!microsoftBusy}
        disabled={!!disabled}
        fullWidth
      />
    </div>
  );
}

/** @deprecated Use OAuthButtonStack for split-screen auth pages. */
export function OAuthButtonRow(props: {
  onGoogle: () => void;
  onMicrosoft: () => void;
  googleBusy?: boolean;
  microsoftBusy?: boolean;
  disabled?: boolean;
}) {
  return <OAuthButtonStack {...props} />;
}

function OAuthButton({
  provider,
  label,
  onClick,
  busy,
  disabled,
  fullWidth,
}: {
  provider: "google" | "microsoft";
  label: string;
  onClick: () => void;
  busy: boolean;
  disabled: boolean;
  fullWidth?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2.5 rounded-lg border border-stroke-subtle bg-surface",
        "font-body text-[13px] font-semibold text-foreground transition-colors",
        fullWidth ? "w-full px-4" : "flex-1 min-w-0 px-3",
        busy || disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-bg-subtle",
      )}
    >
      {busy ? (
        <span
          className="inline-block h-4 w-4 shrink-0 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin"
          aria-hidden
        />
      ) : (
        <span className="inline-flex size-4 shrink-0 items-center justify-center [&_svg]:block [&_svg]:size-4">
          {provider === "google" ? <GoogleIcon /> : <MicrosoftIcon />}
        </span>
      )}
      <span className="truncate">{label}</span>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.28-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.85 14.11A6.59 6.59 0 0 1 5.5 12c0-.73.13-1.44.35-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.67-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.65l3.15-3.15C17.46 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.67 2.84C6.72 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M13 1h10v10H13z" />
      <path fill="#00A4EF" d="M1 13h10v10H1z" />
      <path fill="#FFB900" d="M13 13h10v10H13z" />
    </svg>
  );
}

/** @deprecated Split layout uses AuthScreen title prop instead. */
export function AuthHero({ title, subtitle }: { title: string; subtitle: string }) {
  return <AuthCardTitle title={title} subtitle={subtitle} />;
}
