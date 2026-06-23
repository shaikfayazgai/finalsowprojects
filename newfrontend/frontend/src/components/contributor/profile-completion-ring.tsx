"use client";

/**
 * Circular profile-completion ring (0 → 100 %). Pure SVG; stroke colours are
 * inline so it renders consistently regardless of theme tokens. Used on the
 * contributor profile and inside the ProfileCompletionGate.
 */

import * as React from "react";
import { cn } from "@/lib/utils/cn";

const COLORS = {
  track: "#E6E8EC",
  low: "#E0922F", // < 50 %  — amber
  mid: "#C99A2E", // 50–99 % — gold
  done: "#0F9D6B", // 100 %  — green
};

function colorFor(pct: number): string {
  if (pct >= 100) return COLORS.done;
  if (pct >= 50) return COLORS.mid;
  return COLORS.low;
}

export function ProfileCompletionRing({
  value,
  size = 96,
  stroke = 8,
  showLabel = true,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  showLabel?: boolean;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  const color = colorFor(pct);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center shrink-0", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Profile ${pct}% complete`}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={COLORS.track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 700ms ease-out, stroke 300ms ease" }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-display font-bold tabular-nums leading-none text-foreground"
            style={{ fontSize: size * 0.27, color }}
          >
            {pct}%
          </span>
          <span
            className="font-body text-text-tertiary leading-none mt-0.5"
            style={{ fontSize: Math.max(9, size * 0.1) }}
          >
            complete
          </span>
        </div>
      )}
    </div>
  );
}
