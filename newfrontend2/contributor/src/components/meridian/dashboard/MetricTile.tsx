"use client";

/**
 * Meridian — MetricTile (alternative · backdrop sparkline)
 *
 * Number-first KPI card with the sparkline rendered as a soft
 * watermark behind the content. Inverts the conventional layout
 * (sparkline-below-content) — the trend now reads as ambient
 * context, not foreground decoration.
 *
 *   ┌──────────────────────────────┐
 *   │ ╱──╲╱──╲       (15% opacity) │
 *   │     ↑                        │
 *   │  ACTIVE SOWS                 │
 *   │  17        ▲ 12.5%           │  ← number leads
 *   │  3 in approval               │
 *   │                              │
 *   └──────────────────────────────┘
 *
 * All values flow through semantic tokens. The backdrop sparkline
 * uses `color-mix` against the active tone — auto-resolves across
 * theme switches.
 */

import * as React from "react";
import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type MetricTone = "neutral" | "success" | "warning" | "error" | "info";

interface MetricTileProps {
  label: string;
  value: string | number;
  delta?: number | string;
  tone?: MetricTone;
  hint?: string;
  icon?: LucideIcon;
  spark?: number[];
}

export const MetricTile: React.FC<MetricTileProps> = ({
  label,
  value,
  delta,
  tone,
  hint,
  icon: Icon,
  spark,
}) => {
  const deltaInfo = computeDelta(delta, tone);
  const sparkTone: MetricTone =
    tone && tone !== "neutral"
      ? tone
      : deltaInfo?.direction === "up"
        ? "success"
        : deltaInfo?.direction === "down"
          ? "error"
          : "neutral";

  return (
    <div
      className={cn(
        "group relative overflow-hidden",
        "rounded-xl bg-surface ring-1 ring-stroke-subtle",
        "transition-all duration-fast ease-standard",
        "hover:ring-stroke hover:shadow-[var(--shadow-xs)]",
      )}
    >
      {/* Backdrop sparkline — soft watermark behind the content */}
      {spark && spark.length > 1 && (
        <BackdropSparkline values={spark} tone={sparkTone} />
      )}

      {/* Foreground content */}
      <div className="relative p-5">
        {/* Top row — label + optional icon */}
        <div className="flex items-center justify-between gap-2">
          <p className="font-body text-[11px] font-bold uppercase tracking-[0.12em] text-text-tertiary truncate">
            {label}
          </p>
          {Icon && (
            <Icon
              className="h-3.5 w-3.5 text-text-disabled shrink-0"
              strokeWidth={2}
              aria-hidden
            />
          )}
        </div>

        {/* Value + delta */}
        <div className="mt-3 flex items-baseline gap-2.5 flex-wrap">
          <span className="font-body text-[36px] font-semibold text-foreground leading-none tracking-[-0.03em] tabular-nums">
            {value}
          </span>
          {deltaInfo && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded",
                "font-body text-[10.5px] font-bold tabular-nums",
                deltaInfo.bg,
                deltaInfo.text,
              )}
            >
              {deltaInfo.direction === "up" && (
                <ArrowUp className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
              )}
              {deltaInfo.direction === "down" && (
                <ArrowDown className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
              )}
              <span>{deltaInfo.label}</span>
            </span>
          )}
        </div>

        {/* Hint */}
        {hint && (
          <p className="mt-2 font-body text-[12px] text-text-tertiary leading-tight truncate">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────── Backdrop sparkline ─────────────────────── */

const SPARK_TONE: Record<MetricTone, { stroke: string; fill: string }> = {
  success: {
    stroke: "var(--color-success)",
    fill: "color-mix(in srgb, var(--color-success) 14%, transparent)",
  },
  warning: {
    stroke: "var(--color-warning)",
    fill: "color-mix(in srgb, var(--color-warning) 14%, transparent)",
  },
  error: {
    stroke: "var(--color-error)",
    fill: "color-mix(in srgb, var(--color-error) 14%, transparent)",
  },
  info: {
    stroke: "var(--color-info)",
    fill: "color-mix(in srgb, var(--color-info) 14%, transparent)",
  },
  neutral: {
    stroke: "var(--color-stroke-strong)",
    fill: "color-mix(in srgb, var(--color-stroke-strong) 32%, transparent)",
  },
};

const BackdropSparkline: React.FC<{ values: number[]; tone: MetricTone }> = ({
  values,
  tone,
}) => {
  const palette = SPARK_TONE[tone];
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 100;
  const h = 100;
  const stepX = w / (values.length - 1);

  const points = values.map((v, i) => {
    const x = i * stepX;
    // Map values into the lower 55% of the viewBox so the trend reads
    // as a backdrop ribbon under the content rather than crossing it.
    const y = h - ((v - min) / range) * 50 - 4;
    return [x, y] as const;
  });

  const linePath = points
    .map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`))
    .join(" ");
  const areaPath = `${linePath} L ${w} ${h} L 0 ${h} Z`;

  return (
    <svg
      role="img"
      aria-label="Trend sparkline backdrop"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-90 transition-opacity duration-fast group-hover:opacity-100"
      aria-hidden
    >
      <defs>
        <linearGradient id={`spark-fade-${tone}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0.4" />
        </linearGradient>
        <mask id={`spark-mask-${tone}`}>
          <rect width={w} height={h} fill={`url(#spark-fade-${tone})`} />
        </mask>
      </defs>
      <g mask={`url(#spark-mask-${tone})`}>
        <path d={areaPath} fill={palette.fill} />
        <path
          d={linePath}
          fill="none"
          stroke={palette.stroke}
          strokeWidth={1.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.55}
        />
      </g>
    </svg>
  );
};

/* ─────────────────────── Delta helpers ─────────────────────── */

interface DeltaInfo {
  direction: "up" | "down" | null;
  label: string;
  bg: string;
  text: string;
}

function computeDelta(
  delta: number | string | undefined,
  tone: MetricTone | undefined,
): DeltaInfo | null {
  if (delta === undefined || delta === null) return null;

  let numeric: number | null = null;
  let label: string;
  if (typeof delta === "number") {
    numeric = delta;
    label = `${Math.abs(delta).toFixed(1)}%`;
  } else {
    label = delta;
    const match = delta.match(/-?\d+(?:\.\d+)?/);
    if (match) numeric = Number(match[0]);
  }

  const resolvedTone = tone ?? autoTone(numeric);
  const direction =
    numeric === null ? null : numeric > 0 ? "up" : numeric < 0 ? "down" : null;

  return {
    direction,
    label,
    ...toneClasses(resolvedTone),
  };
}

function autoTone(n: number | null): MetricTone {
  if (n === null) return "neutral";
  if (n > 0) return "success";
  if (n < 0) return "error";
  return "neutral";
}

function toneClasses(tone: MetricTone): { bg: string; text: string } {
  switch (tone) {
    case "success":
      return { bg: "bg-success-subtle", text: "text-success-text" };
    case "warning":
      return { bg: "bg-warning-subtle", text: "text-warning-text" };
    case "error":
      return { bg: "bg-error-subtle", text: "text-error-text" };
    case "info":
      return { bg: "bg-info-subtle", text: "text-info-text" };
    default:
      return { bg: "bg-bg-subtle", text: "text-text-secondary" };
  }
}
