"use client";

/**
 * Meridian — CountdownChip
 *
 * SLA-aware time chip. Auto-tones based on remaining time:
 *   - > 24h         → neutral (text-tertiary + surface-sunken bg)
 *   - 6h to 24h     → warning (amber)
 *   - < 6h          → error (red, pulses if `critical` is set)
 *
 * Renders a compact pill with a clock-style label like "⏱ 4h" or
 * "⏱ 2d". Pass `pastDue` to render an over-due variant in red.
 */

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface CountdownChipProps {
  /** Remaining hours until SLA due. Negative ⇒ past due. */
  hours: number;
  /** Force pulse animation (Critical priority). */
  critical?: boolean;
  className?: string;
}

export const CountdownChip: React.FC<CountdownChipProps> = ({
  hours,
  critical,
  className,
}) => {
  const isPast = hours < 0;
  const tone: "neutral" | "warning" | "error" = isPast
    ? "error"
    : hours < 6
      ? "error"
      : hours < 24
        ? "warning"
        : "neutral";

  const toneCls =
    tone === "error"
      ? "bg-error-subtle text-error-text"
      : tone === "warning"
        ? "bg-warning-subtle text-warning-text"
        : "bg-surface-sunken text-text-secondary";

  const label = isPast
    ? `${Math.abs(hours)}h overdue`
    : hours >= 24
      ? `${Math.round(hours / 24)}d`
      : `${Math.round(hours)}h`;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1 h-[20px] px-1.5 rounded",
        "font-body text-[10.5px] font-semibold tabular-nums leading-none",
        toneCls,
        critical && tone === "error" && "animate-pulse",
        className,
      )}
      aria-label={`SLA: ${label}`}
    >
      <Clock className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
      {label}
    </span>
  );
};
