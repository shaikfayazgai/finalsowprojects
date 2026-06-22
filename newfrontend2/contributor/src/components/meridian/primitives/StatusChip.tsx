/**
 * Meridian — StatusChip
 *
 * Stateful indicator with built-in dot for at-a-glance scanability.
 * Status maps directly to semantic tokens — success / warning / error
 * / info / pending — never raw colors.
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const statusChipVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border font-body font-semibold whitespace-nowrap",
  {
    variants: {
      status: {
        success:
          "bg-success-subtle text-success-text border-success-border",
        warning:
          "bg-warning-subtle text-warning-text border-warning-border",
        error:
          "bg-error-subtle text-error-text border-error-border",
        info: "bg-info-subtle text-info-text border-info-border",
        pending:
          "bg-review-pending-subtle text-review-pending-text border-transparent",
        escalated:
          "bg-review-escalated-subtle text-review-escalated-text border-transparent",
        neutral: "bg-bg-subtle text-text-secondary border-stroke",
      },
      size: {
        sm: "text-[10px] px-1.5 py-[1px]",
        md: "text-[11px] px-2 py-[2px]",
        lg: "text-body-sm px-2.5 py-[3px]",
      },
    },
    defaultVariants: {
      status: "neutral",
      size: "md",
    },
  },
);

const dotColorByStatus: Record<NonNullable<StatusChipProps["status"]>, string> = {
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
  info: "bg-info",
  pending: "bg-review-pending",
  escalated: "bg-review-escalated",
  neutral: "bg-text-tertiary",
};

export interface StatusChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusChipVariants> {
  /** Render a colored leading dot. Defaults to true. */
  showDot?: boolean;
}

export const StatusChip = React.forwardRef<HTMLSpanElement, StatusChipProps>(
  (
    { className, status = "neutral", size, showDot = true, children, ...props },
    ref,
  ) => {
    return (
      <span
        ref={ref}
        className={cn(statusChipVariants({ status, size }), className)}
        {...props}
      >
        {showDot && (
          <span
            aria-hidden
            className={cn(
              "inline-block rounded-full",
              size === "sm" ? "h-1 w-1" : size === "lg" ? "h-2 w-2" : "h-1.5 w-1.5",
              dotColorByStatus[status ?? "neutral"],
            )}
          />
        )}
        {children}
      </span>
    );
  },
);
StatusChip.displayName = "StatusChip";

export { statusChipVariants };
