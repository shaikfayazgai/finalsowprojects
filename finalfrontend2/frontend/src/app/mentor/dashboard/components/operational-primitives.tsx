"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type {
  SlaTier,
  RiskSeverity,
  ReviewState,
  AiConfidenceBand,
} from "@/mocks/data/mentor-workspace";

/**
 * Operational design tokens for Mentor Workspace V2.
 * Severity / SLA / review-state chips share these atoms so the dashboard,
 * queue, alerts panel and activity timeline read with one visual grammar.
 */

const slaTone: Record<
  SlaTier,
  { label: string; dot: string; chip: string; pulse?: boolean }
> = {
  breached: {
    label: "Breached",
    dot: "bg-red-600",
    chip: "bg-red-50 text-red-700 border-red-200",
    pulse: true,
  },
  critical: {
    label: "Critical",
    dot: "bg-red-500",
    chip: "bg-red-50 text-red-700 border-red-200",
  },
  warning: {
    label: "Warning",
    dot: "bg-gold-500",
    chip: "bg-gold-50 text-gold-700 border-gold-200",
  },
  watch: {
    label: "Watch",
    dot: "bg-teal-500",
    chip: "bg-teal-50 text-teal-700 border-teal-200",
  },
  healthy: {
    label: "Healthy",
    dot: "bg-forest-500",
    chip: "bg-forest-50 text-forest-700 border-forest-200",
  },
};

export function SlaIndicator({
  tier,
  remainingHours,
  compact = false,
}: {
  tier: SlaTier;
  remainingHours: number;
  compact?: boolean;
}) {
  const tone = slaTone[tier];
  const label =
    remainingHours < 0
      ? `${Math.abs(remainingHours)}h over`
      : `${remainingHours}h left`;

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          {tone.pulse && (
            <span className={cn("absolute inset-0 rounded-full opacity-60 animate-ping", tone.dot)} />
          )}
          <span className={cn("relative inline-block h-2 w-2 rounded-full", tone.dot)} />
        </span>
        <span className="text-[11px] font-semibold text-gray-700 tabular-nums">{label}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold tabular-nums",
        tone.chip
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {tone.pulse && (
          <span className={cn("absolute inset-0 rounded-full opacity-60 animate-ping", tone.dot)} />
        )}
        <span className={cn("relative inline-block h-1.5 w-1.5 rounded-full", tone.dot)} />
      </span>
      {label}
    </span>
  );
}

const severityTone: Record<RiskSeverity, { label: string; chip: string }> = {
  high: { label: "High", chip: "bg-red-50 text-red-700 border-red-200" },
  medium: { label: "Med", chip: "bg-gold-50 text-gold-700 border-gold-200" },
  low: { label: "Low", chip: "bg-gray-50 text-gray-600 border-gray-200" },
};

export function SeverityChip({ severity }: { severity: RiskSeverity }) {
  const tone = severityTone[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-[1px] text-[10px] font-semibold uppercase tracking-wide",
        tone.chip
      )}
    >
      {tone.label}
    </span>
  );
}

const stateTone: Record<ReviewState, { label: string; chip: string }> = {
  pending: { label: "Pending", chip: "bg-gray-50 text-gray-600 border-gray-200" },
  in_progress: { label: "In progress", chip: "bg-teal-50 text-teal-700 border-teal-200" },
  escalated: { label: "Escalated", chip: "bg-red-50 text-red-700 border-red-200" },
  governance_hold: { label: "Gov hold", chip: "bg-brown-50 text-brown-700 border-brown-200" },
  rework: { label: "Rework", chip: "bg-gold-50 text-gold-700 border-gold-200" },
  ai_ready: { label: "AI ready", chip: "bg-forest-50 text-forest-700 border-forest-200" },
};

export function ReviewStateChip({ state }: { state: ReviewState }) {
  const tone = stateTone[state];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-[1px] text-[10px] font-semibold uppercase tracking-wide",
        tone.chip
      )}
    >
      {tone.label}
    </span>
  );
}

const confidenceTone: Record<AiConfidenceBand, string> = {
  high: "text-forest-700",
  medium: "text-gold-700",
  low: "text-red-700",
};

export function AiConfidenceBadge({
  value,
  band,
}: {
  value: number;
  band: AiConfidenceBand;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className={cn(
          "inline-block h-1.5 w-6 rounded-full",
          band === "high" && "bg-forest-500",
          band === "medium" && "bg-gold-500",
          band === "low" && "bg-red-500"
        )}
      />
      <span className={cn("text-[11px] font-semibold tabular-nums", confidenceTone[band])}>
        {value}%
      </span>
    </span>
  );
}

export function SectionHeader({
  title,
  caption,
  trailing,
}: {
  title: string;
  caption?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div>
        <h2 className="font-heading text-[15px] font-semibold text-brown-950 leading-tight">
          {title}
        </h2>
        {caption && (
          <p className="text-[11.5px] text-gray-500 mt-0.5 leading-snug">{caption}</p>
        )}
      </div>
      {trailing && <div className="shrink-0 pt-0.5">{trailing}</div>}
    </div>
  );
}

export function OperationalCard({
  children,
  className,
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white shadow-[0_1px_0_rgba(0,0,0,0.02),0_2px_8px_-4px_rgba(76,52,40,0.06)]",
        padded && "p-5",
        className
      )}
    >
      {children}
    </div>
  );
}
