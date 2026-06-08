"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { bandFromConfidence, confidenceToken } from "./severity-tokens";

/**
 * Canonical AI confidence gauge.
 *
 * Two visual modes:
 *   - "bar"   — h-1 gradient bar + numeric + band label (used in cards)
 *   - "inline" — small bar pill (used inline in rows · ~h-2 wide)
 *
 * Bands derive from canonical thresholds: ≥85 high · ≥65 medium · <65 low.
 */
export function ConfidenceGauge({
  value,
  variant = "bar",
  showLabel = true,
  size = "md",
  className,
}: {
  value: number;
  variant?: "bar" | "inline";
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const band = bandFromConfidence(value);
  const tone = confidenceToken[band];

  if (variant === "inline") {
    return (
      <span className={cn("inline-flex items-center gap-1.5", className)}>
        <span aria-hidden className={cn("inline-block rounded-full", tone.bar, size === "sm" ? "h-1 w-5" : "h-1.5 w-6")} />
        <span className={cn("text-[11px] font-bold tabular-nums", tone.text)}>{value}%</span>
        {showLabel && (
          <span className={cn("text-[9px] uppercase tracking-wider opacity-80", tone.text)}>{tone.label}</span>
        )}
      </span>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("flex-1 rounded-full bg-gray-100 overflow-hidden", size === "sm" ? "h-1" : "h-1.5")}>
        <div className={cn("h-full rounded-full", tone.bar)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      <span className={cn("inline-flex items-center gap-1 text-[10.5px] font-bold tabular-nums", tone.text)}>
        {value}%
        {showLabel && (
          <span className="text-[9px] uppercase tracking-wider opacity-80">{tone.label}</span>
        )}
      </span>
    </div>
  );
}
