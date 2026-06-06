"use client";

/**
 * Shared UI for `appearance="gradient-glass"` drawers.
 * Semi-transparent surfaces so the sidebar mesh gradient shows through.
 */

import * as React from "react";
import { cn } from "@/lib/utils/cn";

/* ─── surfaces ─── */

/** Semantic stroke on frosted glass — white/50 borders vanish on the glass pane. */
export const glassBorder = "border border-stroke-subtle";
export const glassBorderStrong = "border border-stroke";

export const glassSurface = cn(
  "rounded-xl",
  glassBorder,
  "bg-white/55 backdrop-blur-md",
  "shadow-[0_1px_2px_rgba(14,19,27,0.04),inset_0_1px_0_rgba(255,255,255,0.75)]",
);

export const glassSurfaceStrong = cn(
  "rounded-xl",
  glassBorderStrong,
  "bg-white/72 backdrop-blur-md",
  "shadow-[0_2px_8px_rgba(14,19,27,0.05),inset_0_1px_0_rgba(255,255,255,0.85)]",
);

export const glassInputCls = cn(
  "w-full h-9 px-3 rounded-lg",
  "bg-white/60 backdrop-blur-sm",
  glassBorderStrong,
  "font-body text-[13px] text-foreground placeholder:text-text-disabled",
  "transition-[border-color,background-color,box-shadow] duration-fast",
  "focus-visible:outline-none focus-visible:border-brand/50 focus-visible:ring-2 focus-visible:ring-brand/20 focus-visible:bg-white/85",
);

export const glassBtnPrimary = cn(
  "inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg",
  "bg-brand text-on-brand font-body text-[13px] font-semibold",
  "shadow-[0_1px_2px_rgba(14,19,27,0.08)]",
  "hover:bg-brand-hover transition-colors duration-fast",
  "disabled:opacity-50 disabled:cursor-not-allowed",
);

export const glassBtnSecondary = cn(
  "inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg",
  "bg-white/55 backdrop-blur-sm",
  glassBorderStrong,
  "font-body text-[13px] font-semibold text-foreground",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
  "hover:bg-white/75 hover:border-stroke-strong transition-colors duration-fast",
  "disabled:opacity-50 disabled:cursor-not-allowed",
);

export const glassDivider = "border-stroke-subtle";

/* ─── sections ─── */

export function GlassSection({
  step,
  title,
  hint,
  trailing,
  children,
  className,
}: {
  step?: string;
  title: string;
  hint?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {step && (
              <span className="font-mono text-[10px] font-bold tabular-nums text-text-tertiary">
                {step}
              </span>
            )}
            <h3 className="font-body text-[13px] font-semibold text-foreground tracking-[-0.005em]">
              {title}
            </h3>
          </div>
          {hint && (
            <p className="mt-0.5 font-body text-[11px] text-text-tertiary leading-snug">{hint}</p>
          )}
        </div>
        {trailing}
      </header>
      {children}
    </section>
  );
}

export function GlassField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
        {label}
      </p>
      {children}
    </div>
  );
}

export function GlassCard({
  children,
  className,
  selected,
  onClick,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  selected?: boolean;
  onClick?: () => void;
  as?: "div" | "button";
}) {
  const base = cn(
    glassSurface,
    "p-3.5 transition-[border-color,background-color,box-shadow] duration-fast",
    selected && "border-brand/40 bg-brand/10 ring-1 ring-brand/25",
    onClick && "cursor-pointer hover:bg-white/68 text-left w-full",
    className,
  );

  if (Tag === "button" || onClick) {
    return (
      <button type="button" onClick={onClick} className={base}>
        {children}
      </button>
    );
  }

  return <div className={base}>{children}</div>;
}

export function GlassSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  mono,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  mono?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "inline-flex flex-wrap items-center gap-1 p-1 rounded-lg",
        "bg-white/45 backdrop-blur-sm",
        glassBorder,
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
      )}
    >
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt)}
            className={cn(
              "h-7 px-2.5 rounded-md font-body text-[12px] font-semibold transition-colors duration-fast",
              mono && "font-mono text-[11px]",
              active
                ? "bg-brand text-on-brand shadow-xs"
                : "text-text-secondary hover:bg-white/65 hover:text-foreground",
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export function GlassChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center h-7 px-2.5 rounded-lg font-body text-[12px] font-medium transition-colors duration-fast",
        active
          ? "bg-brand/90 text-on-brand shadow-xs"
          : cn("bg-white/50 text-text-secondary hover:bg-white/70 hover:text-foreground", glassBorder),
      )}
    >
      {label}
    </button>
  );
}

/** Step rail for multi-phase drawers. */
export function GlassPhaseRail({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 p-1 rounded-xl",
        "bg-white/40 backdrop-blur-sm",
        glassBorder,
      )}
    >
      {steps.map((label, i) => {
        const n = i + 1;
        const active = n === current;
        const done = n < current;
        return (
          <div
            key={label}
            className={cn(
              "flex-1 min-w-0 px-2.5 py-1.5 rounded-lg text-center transition-colors duration-fast",
              active && cn(
                "bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
                glassBorder,
              ),
            )}
          >
            <p
              className={cn(
                "font-body text-[11px] truncate",
                active ? "font-semibold text-foreground" : done ? "text-text-secondary" : "text-text-tertiary",
              )}
            >
              {label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function GlassEmpty({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <GlassCard className="py-8 text-center">
      <p className="font-body text-[13px] font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-xs mx-auto">{description}</p>
      )}
    </GlassCard>
  );
}

export function GlassSuccess({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      className={cn(
        glassSurfaceStrong,
        "px-4 py-4 border-success-border/40 bg-success-subtle/35",
      )}
    >
      <p className="font-body text-[13px] font-semibold text-success-text">{title}</p>
      <p className="mt-1.5 font-body text-[12px] text-text-secondary leading-relaxed">{description}</p>
    </div>
  );
}

export function GlassAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full shrink-0",
        "bg-white/65 text-text-secondary",
        glassBorderStrong,
        "font-body text-[11px] font-semibold",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
      )}
    >
      {initials}
    </span>
  );
}

export function GlassMatchScore({ pct }: { pct: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10.5px] font-bold tabular-nums",
        "bg-white/55 backdrop-blur-sm",
        glassBorder,
        pct >= 90 ? "text-success-text" : pct >= 75 ? "text-warning-text" : "text-text-secondary",
      )}
    >
      {pct}%
    </span>
  );
}
