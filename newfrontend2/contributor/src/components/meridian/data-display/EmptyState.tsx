/**
 * Meridian — EmptyState
 *
 * Used inside Cards / panels when a list / queue / table has no data.
 * Three tones map to the operational read:
 *   neutral   — informational ("No deliveries pending acceptance")
 *   success   — positive completion ("All clear — no escalations")
 *   warning   — anomaly worth surfacing ("No mentor activity recorded yet")
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const ringVariants = cva(
  "inline-flex h-10 w-10 items-center justify-center rounded-xl ring-2 ring-surface mb-2",
  {
    variants: {
      tone: {
        neutral: "bg-bg-subtle text-text-secondary",
        success: "bg-success-subtle text-success-text",
        warning: "bg-warning-subtle text-warning-text",
        ai: "bg-ai-highlight text-ai-text",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

interface EmptyStateProps extends VariantProps<typeof ringVariants> {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  tone,
  className,
}) => {
  return (
    <div className={cn("px-5 py-12 text-center", className)}>
      {icon && <span className={ringVariants({ tone })}>{icon}</span>}
      <p className="font-display text-heading-md font-semibold text-primary">
        {title}
      </p>
      {description && (
        <p className="font-body text-body-sm text-text-tertiary mt-1 max-w-md mx-auto leading-snug">
          {description}
        </p>
      )}
      {action && <div className="mt-4 inline-flex">{action}</div>}
    </div>
  );
};
