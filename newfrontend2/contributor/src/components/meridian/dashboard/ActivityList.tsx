"use client";

/**
 * Meridian — ActivityList (timeline · redesigned)
 *
 * Vertical-timeline activity feed. Each row sits on a continuous rail
 * with a tone-coded dot punched into it. Title + time on one row,
 * description below — cleaner read than the previous icon-tile + badge
 * layout.
 *
 *   │   ●  You approved SOW-Helios-2026Q2       12 min ago
 *   │      Commercial gate cleared · settlement enabled
 *   │
 *   │   ●  AI flagged risk on PROJ-104          28 min ago
 *   │      Burnout signal detected across 3 contributors
 *
 * Color discipline: every dot/text/divider routes through a semantic
 * token — `var(--color-success | warning | error | info | secondary |
 * tertiary)`. No raw hex.
 */

import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type ActivityPriority = "high" | "medium" | "low" | "info";
export type ActivityTone = "blue" | "green" | "violet" | "cyan" | "amber" | "red";

export interface ActivityRow {
  id: string;
  icon: LucideIcon;
  tone: ActivityTone;
  title: string;
  description?: string;
  meta?: string;
  priority?: ActivityPriority;
}

interface ActivityListProps {
  items: ActivityRow[];
  className?: string;
}

/* ─────────────────────── Tone → semantic var mapping ─────────────────────── */

const TONE_DOT: Record<ActivityTone, string> = {
  green: "bg-[var(--color-success)]",
  amber: "bg-[var(--color-warning)]",
  red: "bg-[var(--color-error)]",
  blue: "bg-[var(--color-info)]",
  violet: "bg-[var(--color-secondary)]",
  cyan: "bg-[var(--color-tertiary)]",
};

const TONE_ICON: Record<ActivityTone, string> = {
  green: "text-[var(--color-success)]",
  amber: "text-[var(--color-warning)]",
  red: "text-[var(--color-error)]",
  blue: "text-[var(--color-info)]",
  violet: "text-[var(--color-secondary)]",
  cyan: "text-[var(--color-tertiary)]",
};

/* ─────────────────────── Component ─────────────────────── */

export const ActivityList: React.FC<ActivityListProps> = ({
  items,
  className,
}) => (
  <ol role="list" className={cn("relative", className)}>
    {/* Continuous timeline rail */}
    <span
      aria-hidden
      className="absolute left-[15px] top-3 bottom-3 w-px bg-stroke-subtle"
    />

    {items.map((item, idx) => (
      <TimelineRow
        key={item.id}
        item={item}
        isFirst={idx === 0}
        isLast={idx === items.length - 1}
      />
    ))}
  </ol>
);

/* ─────────────────────── Row ─────────────────────── */

const TimelineRow: React.FC<{
  item: ActivityRow;
  isFirst: boolean;
  isLast: boolean;
}> = ({ item, isFirst, isLast }) => {
  const Icon = item.icon;
  return (
    <li
      className={cn(
        "relative pl-10 pr-2",
        "py-3 first:pt-1 last:pb-1",
      )}
    >
      {/* Tone dot — punched through the rail with a ring of surface */}
      <span
        aria-hidden
        className={cn(
          "absolute left-[8px] top-[16px] grid place-items-center h-4 w-4 rounded-full",
          "ring-4 ring-surface",
          TONE_DOT[item.tone],
        )}
      >
        <Icon
          className={cn("h-2.5 w-2.5 text-on-brand")}
          strokeWidth={2.75}
          aria-hidden
        />
      </span>

      {/* Title row */}
      <div className="flex items-baseline justify-between gap-3 min-w-0">
        <p className="font-body text-[12.5px] font-semibold text-foreground leading-tight truncate">
          {item.title}
        </p>
        {item.meta && (
          <span className="shrink-0 font-body text-[11px] text-text-tertiary tabular-nums whitespace-nowrap">
            {item.meta}
          </span>
        )}
      </div>

      {/* Description */}
      {item.description && (
        <p className="mt-1 font-body text-[12px] text-text-secondary leading-snug">
          {item.description}
        </p>
      )}

      {/* Suppress unused props for backward compat */}
      <span hidden aria-hidden>
        {item.priority}
        {String(isFirst)}
        {String(isLast)}
        <span className={TONE_ICON[item.tone]} />
      </span>
    </li>
  );
};
