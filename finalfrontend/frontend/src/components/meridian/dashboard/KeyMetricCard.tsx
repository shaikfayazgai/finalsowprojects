"use client";

/**
 * Meridian — KeyMetricCard
 *
 * Premium KPI card matching the reference design — large circular
 * tinted icon, label, big number, delta + sparkline at the bottom.
 *
 *   ┌──────────────────────────┐
 *   │ (●)                      │  ← circular tinted icon
 *   │                          │
 *   │ ACTIVE TASKS             │  ← small label
 *   │                          │
 *   │ 85 / 30k    ▲ 12.5%      │  ← big number + delta
 *   │             ━━━━━━━━━━    │  ← sparkline matches icon tone
 *   └──────────────────────────┘
 */

import * as React from "react";
import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type MetricTone = "blue" | "green" | "violet" | "cyan" | "amber" | "red";

interface KeyMetricCardProps {
  icon: LucideIcon;
  tone: MetricTone;
  label: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  hint?: string;
  spark?: number[];
}

export const KeyMetricCard: React.FC<KeyMetricCardProps> = ({
  icon: Icon,
  tone,
  label,
  value,
  delta,
  deltaLabel,
  hint,
  spark,
}) => {
  const tonePalette = TONE_MAP[tone];

  return (
    <div
      className={cn(
        "group p-5 rounded-2xl",
        "bg-surface border border-stroke-subtle",
        "transition-all duration-fast ease-standard",
        "hover:border-stroke hover:shadow-[var(--shadow-sm)]",
      )}
    >
      {/* Icon */}
      <span
        aria-hidden
        className={cn(
          "inline-grid place-items-center h-10 w-10 rounded-full mb-4",
          tonePalette.iconBg,
          tonePalette.iconText,
        )}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      </span>

      {/* Label */}
      <p className="font-body text-[11px] font-semibold uppercase tracking-[0.12em] text-text-tertiary">
        {label}
      </p>

      {/* Value + delta */}
      <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
        <span className="font-body text-[28px] font-bold text-foreground leading-none tracking-[-0.025em] tabular-nums">
          {value}
        </span>
        {(delta !== undefined || deltaLabel) && (
          <DeltaChip value={delta} label={deltaLabel} />
        )}
      </div>

      {/* Sparkline + hint */}
      <div className="mt-3 flex items-center justify-between gap-3">
        {hint && (
          <p className="font-body text-[11.5px] text-text-tertiary leading-tight truncate">
            {hint}
          </p>
        )}
        {spark && spark.length > 1 && (
          <Sparkline
            values={spark}
            tone={tonePalette.sparkStroke}
            fill={tonePalette.sparkFill}
            className="flex-1 max-w-[120px] ml-auto"
          />
        )}
      </div>
    </div>
  );
};

/* ─────────────────────── Delta chip ─────────────────────── */

const DeltaChip: React.FC<{ value?: number; label?: string }> = ({
  value,
  label,
}) => {
  const tone =
    value === undefined ? "neutral" : value > 0 ? "success" : value < 0 ? "error" : "neutral";
  const direction = value === undefined ? null : value > 0 ? "up" : value < 0 ? "down" : null;
  const display =
    label ?? (value !== undefined ? `${Math.abs(value).toFixed(1)}%` : "");

  const toneCls =
    tone === "success"
      ? "bg-success-subtle text-success-text"
      : tone === "error"
        ? "bg-error-subtle text-error-text"
        : "bg-bg-subtle text-text-secondary";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded",
        "font-body text-[10.5px] font-bold tabular-nums",
        toneCls,
      )}
    >
      {direction === "up" && (
        <ArrowUp className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
      )}
      {direction === "down" && (
        <ArrowDown className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
      )}
      <span>{display}</span>
    </span>
  );
};

/* ─────────────────────── Sparkline (SVG smooth) ─────────────────────── */

const Sparkline: React.FC<{
  values: number[];
  tone: string;
  fill: string;
  className?: string;
}> = ({ values, tone, fill, className }) => {
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 100;
  const h = 28;
  const stepX = w / (values.length - 1);

  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return [x, y] as const;
  });

  const linePath = points
    .map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`))
    .join(" ");
  const areaPath = `${linePath} L ${w} ${h} L 0 ${h} Z`;

  return (
    <svg
      role="img"
      aria-label="Trend sparkline"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={cn("block h-7", className)}
    >
      <path d={areaPath} fill={fill} />
      <path
        d={linePath}
        fill="none"
        stroke={tone}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/* ─────────────────────── Tone palette ─────────────────────── */

interface TonePalette {
  iconBg: string;
  iconText: string;
  sparkStroke: string;
  sparkFill: string;
}

const TONE_MAP: Record<MetricTone, TonePalette> = {
  blue: {
    iconBg: "bg-[var(--c-blue-50)]",
    iconText: "text-[var(--c-blue-600)]",
    sparkStroke: "var(--c-blue-500)",
    sparkFill: "color-mix(in srgb, var(--c-blue-500) 14%, transparent)",
  },
  green: {
    iconBg: "bg-[var(--c-green-50)]",
    iconText: "text-[var(--c-green-600)]",
    sparkStroke: "var(--c-green-500)",
    sparkFill: "color-mix(in srgb, var(--c-green-500) 14%, transparent)",
  },
  violet: {
    iconBg: "bg-[var(--c-violet-50)]",
    iconText: "text-[var(--c-violet-600)]",
    sparkStroke: "var(--c-violet-500)",
    sparkFill: "color-mix(in srgb, var(--c-violet-500) 14%, transparent)",
  },
  cyan: {
    iconBg: "bg-[var(--c-cyan-50)]",
    iconText: "text-[var(--c-cyan-600)]",
    sparkStroke: "var(--c-cyan-500)",
    sparkFill: "color-mix(in srgb, var(--c-cyan-500) 14%, transparent)",
  },
  amber: {
    iconBg: "bg-[var(--c-amber-50)]",
    iconText: "text-[var(--c-amber-600)]",
    sparkStroke: "var(--c-amber-500)",
    sparkFill: "color-mix(in srgb, var(--c-amber-500) 14%, transparent)",
  },
  red: {
    iconBg: "bg-[var(--c-red-50)]",
    iconText: "text-[var(--c-red-600)]",
    sparkStroke: "var(--c-red-500)",
    sparkFill: "color-mix(in srgb, var(--c-red-500) 14%, transparent)",
  },
};
