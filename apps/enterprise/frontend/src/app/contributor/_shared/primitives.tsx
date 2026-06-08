"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { ContributorState } from "@/mocks/data/contributor-workspace";

/**
 * Contributor Portal V2 — shared productivity primitives.
 *
 * Distinct from the mentor portal's `_shared/workflow/` layer. The
 * contributor primitives are tuned for:
 *   - card-forward layouts (rounded-2xl, soft shadows, larger padding)
 *   - teal accent (productivity-blue) instead of brown/forest
 *   - friendly tone (no severity rails by default)
 *   - calmer color treatments (no red-everywhere)
 */

/* ─────────────────────── ContributorCard ─────────────────────── */

export function ContributorCard({
  children,
  className,
  padded = true,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
  variant?: "default" | "feature" | "soft";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border transition-shadow",
        variant === "feature"
          ? "border-teal-200/70 bg-gradient-to-br from-teal-50/60 to-white shadow-[0_4px_16px_-8px_rgba(91,155,162,0.18)]"
          : variant === "soft"
          ? "border-beige-200 bg-beige-50/40"
          : "border-beige-200 bg-white shadow-[0_1px_0_rgba(0,0,0,0.02),0_2px_10px_-6px_rgba(76,52,40,0.06)]",
        padded && "p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ─────────────────────── SectionHeader ─────────────────────── */

export function ContributorSectionHeader({
  title,
  caption,
  trailing,
}: {
  title: string;
  caption?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h2 className="font-heading text-[17px] font-semibold text-brown-950 leading-tight">
          {title}
        </h2>
        {caption && (
          <p className="text-[12.5px] text-beige-700 mt-1 leading-snug">{caption}</p>
        )}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
}

/* ─────────────────────── ContributorStateChip ─────────────────────── */

const stateTone: Record<
  ContributorState,
  { chip: string; dot: string; label: string }
> = {
  assigned: {
    chip: "border-teal-200 bg-teal-50 text-teal-700",
    dot: "bg-teal-500",
    label: "New",
  },
  accepted: {
    chip: "border-teal-200 bg-teal-50 text-teal-700",
    dot: "bg-teal-500",
    label: "Accepted",
  },
  in_progress: {
    chip: "border-teal-300 bg-teal-100 text-teal-800",
    dot: "bg-teal-600",
    label: "In progress",
  },
  blocked: {
    chip: "border-beige-300 bg-beige-100 text-beige-800",
    dot: "bg-beige-500",
    label: "Paused",
  },
  awaiting_clarification: {
    chip: "border-gold-200 bg-gold-50 text-gold-700",
    dot: "bg-gold-500",
    label: "Awaiting reply",
  },
  ready_for_submission: {
    chip: "border-forest-200 bg-forest-50 text-forest-700",
    dot: "bg-forest-500",
    label: "Ready to submit",
  },
  under_review: {
    chip: "border-beige-200 bg-beige-50 text-beige-700",
    dot: "bg-beige-500",
    label: "Under review",
  },
  revision_requested: {
    chip: "border-gold-200 bg-gold-50 text-gold-800",
    dot: "bg-gold-500",
    label: "Action needed",
  },
  approved: {
    chip: "border-forest-200 bg-forest-50 text-forest-700",
    dot: "bg-forest-500",
    label: "Accepted",
  },
  completed: {
    chip: "border-forest-100 bg-forest-50/60 text-forest-700",
    dot: "bg-forest-400",
    label: "Completed",
  },
  escalated: {
    chip: "border-beige-200 bg-beige-50 text-beige-700",
    dot: "bg-beige-400",
    label: "Under platform review",
  },
};

export function ContributorStateChip({
  state,
  size = "md",
}: {
  state: ContributorState;
  size?: "sm" | "md";
}) {
  const t = stateTone[state];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-wide",
        size === "sm" ? "px-2 py-[1px] text-[10px]" : "px-2.5 py-0.5 text-[11px]",
        t.chip
      )}
    >
      <span className={cn("inline-block h-1.5 w-1.5 rounded-full", t.dot)} />
      {t.label}
    </span>
  );
}

/* ─────────────────────── ReadinessBar ─────────────────────── */

export function ReadinessBar({
  value,
  label,
  size = "md",
}: {
  value: number;
  label?: string;
  size?: "sm" | "md";
}) {
  const tone =
    value >= 90
      ? "bg-forest-500"
      : value >= 60
      ? "bg-teal-500"
      : value >= 30
      ? "bg-gold-500"
      : "bg-beige-400";
  const textTone =
    value >= 90
      ? "text-forest-700"
      : value >= 60
      ? "text-teal-700"
      : value >= 30
      ? "text-gold-700"
      : "text-beige-700";

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex-1 rounded-full bg-beige-100 overflow-hidden",
          size === "sm" ? "h-1" : "h-1.5"
        )}
      >
        <div
          className={cn("h-full rounded-full transition-all", tone)}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
      <span className={cn("text-[11px] font-bold tabular-nums shrink-0 w-9 text-right", textTone)}>
        {value}%
      </span>
      {label && (
        <span className="text-[10.5px] text-beige-600 shrink-0">{label}</span>
      )}
    </div>
  );
}

/* ─────────────────────── AiSuggestionConfidence ─────────────────────── */

export function AiSuggestionConfidence({
  level,
  className,
}: {
  level: "high" | "medium" | "low";
  className?: string;
}) {
  const tone = {
    high: "border-teal-200 bg-teal-50 text-teal-700",
    medium: "border-beige-200 bg-beige-50 text-beige-700",
    low: "border-beige-200 bg-beige-50 text-beige-600",
  }[level];
  const label = { high: "High", medium: "Medium", low: "Light" }[level];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-[1px] text-[10px] font-semibold tracking-wide",
        tone,
        className
      )}
    >
      {label} confidence
    </span>
  );
}

/* ─────────────────────── AiSuggestionBlock ─────────────────────── */

export function AiSuggestionBlock({
  children,
  label = "Suggestion",
  className,
}: {
  children: React.ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-teal-200 bg-teal-50/40 px-3.5 py-2.5",
        className
      )}
    >
      <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-700">
        <AiGlyph />
        {label}
      </p>
      <p className="mt-1 text-[12.5px] text-brown-900 leading-relaxed">{children}</p>
    </div>
  );
}

/* ─────────────────────── AiGlyph ─────────────────────── */

/**
 * Deliberately minimal AI glyph — a small filled square with a thin inner ring.
 * Not a sparkle, not a robot. Reads as "AI" without anthropomorphizing.
 */
export function AiGlyph({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex items-center justify-center h-3 w-3 rounded-[3px] bg-teal-600",
        className
      )}
    >
      <span className="block h-1.5 w-1.5 rounded-[1px] bg-teal-100" />
    </span>
  );
}

/* ─────────────────────── DeadlinePill ─────────────────────── */

export function DeadlinePill({
  hoursRemaining,
  className,
}: {
  hoursRemaining: number;
  className?: string;
}) {
  const tone =
    hoursRemaining < 0
      ? "border-beige-300 bg-beige-100 text-beige-800"
      : hoursRemaining <= 12
      ? "border-gold-200 bg-gold-50 text-gold-800"
      : hoursRemaining <= 48
      ? "border-teal-200 bg-teal-50 text-teal-700"
      : "border-beige-200 bg-beige-50 text-beige-700";

  const label =
    hoursRemaining < 0
      ? `Past deadline · ${Math.abs(hoursRemaining)}h`
      : hoursRemaining === 0
      ? "Due now"
      : hoursRemaining < 24
      ? `${hoursRemaining}h left`
      : `${Math.floor(hoursRemaining / 24)}d ${hoursRemaining % 24}h left`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-[1px] text-[10.5px] font-semibold tabular-nums",
        tone,
        className
      )}
    >
      {label}
    </span>
  );
}

/* ─────────────────────── ContributorPageHeader ─────────────────────── */

/**
 * Reusable header for secondary contributor pages (My Work, Submissions,
 * Revisions, etc.). Softer than the mentor portal's OperationalPageHeader
 * — friendlier tone, eyebrow context chip, less metric-dense.
 */
export function ContributorPageHeader({
  eyebrow,
  title,
  subtitle,
  contextChips,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  contextChips?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-beige-50 via-white to-teal-50/20 border border-beige-200 px-6 py-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-teal-700">
              {eyebrow}
            </p>
          )}
          <h1 className="font-heading text-[24px] font-semibold text-brown-950 leading-tight mt-1">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[13px] text-beige-700 mt-1.5 max-w-2xl leading-relaxed">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {contextChips && (
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-0.5">{contextChips}</div>
      )}
    </div>
  );
}

/**
 * Context chip used in the page header chip row. Visually quieter than
 * the mentor portal's chips — pill-shaped, beige, with optional active
 * teal tint.
 */
export function ContributorContextChip({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-colors",
        active
          ? "border-teal-300 bg-teal-50 text-teal-800"
          : "border-beige-200 bg-white text-beige-700 hover:border-beige-300"
      )}
    >
      <span className="text-beige-500">{label}:</span>
      <span className="font-semibold">{value ?? "All"}</span>
    </button>
  );
}

/* ─────────────────────── PriorityChip ─────────────────────── */

export function PriorityChip({ priority }: { priority: "P0" | "P1" | "P2" }) {
  const tone = {
    P0: "border-brown-200 bg-brown-50 text-brown-700",
    P1: "border-beige-200 bg-beige-50 text-beige-700",
    P2: "border-beige-200 bg-beige-50 text-beige-600",
  }[priority];
  const label = {
    P0: "High priority",
    P1: "Standard",
    P2: "Flexible",
  }[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-[1px] text-[10px] font-semibold tracking-wide",
        tone
      )}
    >
      {label}
    </span>
  );
}
