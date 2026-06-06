"use client";

/**
 * Shared shell for /onboarding/* pages — split-screen layout matching auth.
 */

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import {
  AuthCardTitle,
  AuthFormCard,
  AuthMobileTrustStrip,
  AuthOnboardingRailHint,
  AuthSplitLayout,
} from "@/components/auth/auth-split-layout";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthSplitLayout>
      {children}
      <AuthMobileTrustStrip />
    </AuthSplitLayout>
  );
}

export interface AuthCardProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthCard({ eyebrow, title, subtitle, children, footer, className }: AuthCardProps) {
  return (
    <AuthFormCard className={className}>
      {eyebrow ? (
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-brand-emphasis text-center mb-2">
          {eyebrow}
        </p>
      ) : null}
      <AuthCardTitle title={title} subtitle={subtitle} />
      <div className="space-y-5">{children}</div>
      <AuthOnboardingRailHint />
      {footer ? (
        <div className="pt-4 mt-5 border-t border-stroke-subtle">{footer}</div>
      ) : null}
    </AuthFormCard>
  );
}

export const inputCls =
  "block w-full h-10 px-3 rounded-lg border border-stroke bg-surface font-body text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand/25 focus:border-brand transition-all duration-fast";

export function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block font-body text-[12px] font-medium text-foreground mb-1.5">
      {children}
    </label>
  );
}

export function PrimaryButton({
  children,
  disabled,
  onClick,
  type = "button",
  loading,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  loading?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "w-full inline-flex items-center justify-center h-11 px-4 rounded-lg font-body text-[14px] font-semibold transition-colors duration-fast",
        disabled || loading
          ? "bg-bg-subtle text-text-tertiary cursor-not-allowed"
          : "bg-brand text-on-brand hover:bg-brand-hover shadow-xs",
      )}
    >
      {loading ? (
        <>
          <span
            className="inline-block h-3.5 w-3.5 rounded-full border-2 border-on-brand/40 border-t-on-brand animate-spin mr-2"
            aria-hidden
          />
          Working…
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="w-full inline-flex items-center justify-center h-11 px-4 rounded-lg bg-surface border border-stroke font-body text-[14px] font-semibold text-foreground hover:bg-surface-hover transition-colors duration-fast"
    >
      {children}
    </button>
  );
}
