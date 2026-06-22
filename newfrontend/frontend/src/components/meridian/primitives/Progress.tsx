/**
 * Meridian — Progress
 *
 * Linear progress indicator with three tones (brand / success /
 * neutral). For multi-segment progress (readiness bars), use the
 * `segments` API which renders proportional segments side-by-side.
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const progressVariants = cva(
  "w-full overflow-hidden rounded-full bg-stroke-subtle",
  {
    variants: {
      size: {
        sm: "h-1",
        md: "h-1.5",
        lg: "h-2",
        xl: "h-2.5",
      },
    },
    defaultVariants: { size: "md" },
  },
);

const fillVariants = cva("h-full transition-all duration-base ease-standard", {
  variants: {
    tone: {
      brand: "bg-brand",
      success: "bg-success",
      warning: "bg-warning",
      error: "bg-error",
      neutral: "bg-text-tertiary",
    },
  },
  defaultVariants: { tone: "brand" },
});

export interface ProgressSegment {
  value: number;
  tone?: VariantProps<typeof fillVariants>["tone"];
  label?: string;
}

export interface ProgressProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    VariantProps<typeof progressVariants> {
  /** 0..100 — used in single-bar mode. */
  value?: number;
  tone?: VariantProps<typeof fillVariants>["tone"];
  /** Multi-segment mode. Values are absolute counts, normalized to 100%. */
  segments?: ProgressSegment[];
  /** A11y label for assistive tech. */
  ariaLabel?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  className,
  size,
  value,
  tone,
  segments,
  ariaLabel,
  ...props
}) => {
  if (segments && segments.length > 0) {
    const total = segments.reduce((acc, s) => acc + s.value, 0) || 1;
    return (
      <div
        className={cn(progressVariants({ size }), "flex", className)}
        role="progressbar"
        aria-label={ariaLabel}
        {...props}
      >
        {segments.map((seg, i) => (
          <span
            key={i}
            title={seg.label}
            style={{ width: `${(seg.value / total) * 100}%` }}
            className={cn(fillVariants({ tone: seg.tone ?? "brand" }))}
          />
        ))}
      </div>
    );
  }

  const safeValue = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div
      className={cn(progressVariants({ size }), className)}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={100}
      {...props}
    >
      <span
        className={cn(fillVariants({ tone }))}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
};
