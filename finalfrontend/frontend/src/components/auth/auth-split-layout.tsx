"use client";

/**
 * Split-screen auth — soft mesh canvas + white form card (Meridian).
 */

import * as React from "react";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, MESH_CANVAS } from "@/app/admin/_shell/aurora";

export function AuthSplitLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative min-h-dvh flex flex-col lg:flex-row", className)}>
      <div aria-hidden className="fixed inset-0 -z-10" style={MESH_CANVAS} />

      <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-8 lg:px-14 lg:py-12 min-h-dvh lg:min-h-0">
        <div className="w-full max-w-[420px]">{children}</div>
      </div>

      <AuthMarketingRail />
    </div>
  );
}

export function AuthBrandMark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center justify-center gap-2.5 text-foreground mx-auto mb-6", className)}
    >
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-on-brand font-display text-[17px] font-bold shadow-[0_4px_14px_-4px_rgba(58,107,244,0.45)]">
        G
      </span>
      <span className="font-body text-[15px] font-semibold tracking-[-0.02em]">GlimmoraTeam</span>
    </Link>
  );
}

export function AuthFormCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(DASH_CARD, "w-full px-6 py-8 sm:px-8", className)}>
      {children}
    </div>
  );
}

export function AuthCardTitle({
  title,
  subtitle,
  centered = true,
}: {
  title: string;
  subtitle?: string;
  centered?: boolean;
}) {
  return (
    <header className={cn("mb-6", centered && "text-center")}>
      <h1 className="font-display text-[24px] sm:text-[26px] font-semibold text-foreground tracking-[-0.03em] leading-tight">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 font-body text-[14px] text-text-secondary leading-relaxed">{subtitle}</p>
      ) : null}
    </header>
  );
}

export function AuthCardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
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

function AuthMarketingRail() {
  return (
    <aside
      className={cn(
        "relative hidden lg:flex lg:w-[min(50%,560px)] lg:shrink-0 flex-col justify-center min-h-dvh px-10 xl:px-14 py-12 overflow-hidden",
        "border-l border-stroke-subtle bg-surface/40",
      )}
      aria-hidden
    >
      <div className="relative z-10 max-w-md">
        <Link href="/" className="inline-flex items-center gap-2.5 text-foreground mb-10">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-on-brand font-display text-[16px] font-bold">
            G
          </span>
          <span className="font-body text-[15px] font-semibold tracking-[-0.02em]">GlimmoraTeam</span>
        </Link>

        <h2 className="font-display text-[30px] xl:text-[34px] font-semibold text-foreground tracking-[-0.03em] leading-[1.12]">
          Secure workforce access
        </h2>
        <p className="mt-3.5 font-body text-[14px] text-text-secondary leading-relaxed max-w-[34ch]">
          AI-governed delivery, verified credentials, and governed payouts — one workspace for contributors,
          mentors, and enterprise teams.
        </p>
      </div>

      <div className="relative z-10 mt-12 xl:mt-14 w-full max-w-lg">
        <div className="relative min-h-[300px]">
          <ShowcaseCard className="absolute top-0 left-0 w-[72%] z-20" title="Contributor profile" icon={Users}>
            <div className="space-y-2.5 mt-3">
              <ShowcaseRow label="Skills declared" value="React · L3" />
              <ShowcaseRow label="Availability" value="15h / week" />
              <ShowcaseRow label="Credentials" value="2 verified" highlight />
            </div>
          </ShowcaseCard>

          <ShowcaseCard className="absolute top-[88px] right-0 w-[68%] z-30" title="Task matching" icon={Sparkles}>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["React", "TypeScript", "On-time"].map((tag) => (
                <span
                  key={tag}
                  className="inline-flex px-2 py-0.5 rounded-md bg-brand-subtle text-brand-subtle-text font-body text-[10.5px] font-semibold"
                >
                  {tag}
                </span>
              ))}
            </div>
          </ShowcaseCard>

          <ShowcaseCard className="absolute bottom-0 left-[12%] w-[64%] z-10" title="Credential wallet" icon={Award}>
            <div className="mt-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success-text shrink-0" strokeWidth={2} />
              <span className="font-body text-[11.5px] text-text-secondary">Helios API refactor · Accepted</span>
            </div>
          </ShowcaseCard>
        </div>
      </div>
    </aside>
  );
}

function ShowcaseCard({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(DASH_CARD, "p-4", className)}>
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-bg-subtle border border-stroke-subtle">
          <Icon className="h-3.5 w-3.5 text-text-secondary" strokeWidth={2} />
        </span>
        <span className="font-body text-[12px] font-semibold text-foreground">{title}</span>
      </div>
      {children}
    </div>
  );
}

function ShowcaseRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-body text-[11px] text-text-tertiary">{label}</span>
      <span
        className={cn(
          "font-body text-[11.5px] font-semibold tabular-nums",
          highlight ? "text-brand-emphasis" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function AuthMobileTrustStrip() {
  return (
    <div className="lg:hidden mt-8 rounded-xl border border-stroke-subtle bg-bg-subtle/80 px-4 py-3 flex items-start gap-2.5">
      <ShieldCheck className="h-4 w-4 text-brand shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
      <p className="font-body text-[12px] text-text-secondary leading-relaxed">
        Governed delivery workspace — skills, credentials, and payouts in one place.
      </p>
    </div>
  );
}

export function AuthOnboardingRailHint() {
  return (
    <div className="mt-6 flex items-center gap-2 rounded-xl border border-stroke-subtle bg-bg-subtle/80 px-3.5 py-2.5">
      <LayoutDashboard className="h-4 w-4 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
      <p className="font-body text-[12px] text-text-secondary">
        Complete onboarding once — your profile carries forward to every task.
      </p>
    </div>
  );
}
