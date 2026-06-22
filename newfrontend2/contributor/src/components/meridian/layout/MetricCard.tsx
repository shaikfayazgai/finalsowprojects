/**
 * Meridian — MetricCard
 *
 * Standardized KPI tile. Replaces the ~50 ad-hoc KPI tile
 * implementations scattered across the V2 portals.
 *
 * Slots:
 *   icon     — leading semantic icon
 *   label    — caption text above the value
 *   value    — Fraunces heading (numbers feel editorial)
 *   helper   — supporting micro-text below
 *   trend    — optional delta chip (▲ 4.2%)
 *   tone     — semantic palette: brand / success / warning / error / neutral / ai
 *   accent   — when true, adds a saffron glow shadow (for the hero KPI)
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const tilePalette = cva("rounded-xl border bg-surface p-3.5 flex items-start gap-3", {
  variants: {
    tone: {
      brand: "border-stroke",
      success: "border-success-border",
      warning: "border-warning-border",
      error: "border-error-border",
      neutral: "border-stroke",
      ai: "border-ai-border bg-ai-surface",
    },
    accent: {
      true: "shadow-glow-primary",
    },
  },
  defaultVariants: { tone: "neutral" },
});

const iconRing = cva(
  "inline-flex h-9 w-9 items-center justify-center rounded-xl ring-2 ring-surface shrink-0",
  {
    variants: {
      tone: {
        brand: "bg-brand-subtle text-brand-subtle-text",
        success: "bg-success-subtle text-success-text",
        warning: "bg-warning-subtle text-warning-text",
        error: "bg-error-subtle text-error-text",
        neutral: "bg-bg-subtle text-text-secondary",
        ai: "bg-ai-highlight text-ai-text",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface MetricCardProps
  extends VariantProps<typeof tilePalette>,
    Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  icon?: React.ReactNode;
  label: React.ReactNode;
  value: React.ReactNode;
  helper?: React.ReactNode;
  trend?: React.ReactNode;
}

export const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  (
    { className, tone, accent, icon, label, value, helper, trend, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(tilePalette({ tone, accent }), className)}
        {...props}
      >
        {icon && (
          <span className={iconRing({ tone })} aria-hidden>
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">
            {label}
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <p className="font-display text-[19px] font-semibold text-foreground leading-none tabular-nums">
              {value}
            </p>
            {trend}
          </div>
          {helper && (
            <p className="font-body text-[10.5px] text-text-tertiary mt-1 leading-snug">
              {helper}
            </p>
          )}
        </div>
      </div>
    );
  },
);
MetricCard.displayName = "MetricCard";
