/**
 * Meridian — Badge
 *
 * Pill-shaped label for taxonomy / counts / categorization. For
 * stateful indicators (success / warning / error / etc.) use
 * StatusChip instead — same shape, semantic-status palette.
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border font-body font-semibold whitespace-nowrap",
  {
    variants: {
      variant: {
        neutral: "bg-bg-subtle text-text-secondary border-stroke",
        primary:
          "bg-brand-subtle text-brand-subtle-text border-transparent",
        secondary:
          "bg-brand-secondary-subtle text-brand-secondary-subtle-text border-transparent",
        tertiary:
          "bg-brand-tertiary-subtle text-brand-tertiary-subtle-text border-transparent",
        outline: "bg-transparent text-primary border-stroke-strong",
        ai: "bg-ai-highlight text-ai-text border-ai-border",
      },
      size: {
        sm: "text-[10px] px-1.5 py-[1px]",
        md: "text-[11px] px-2 py-[2px]",
        lg: "text-body-sm px-2.5 py-[3px]",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "md",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  leadingIcon?: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, leadingIcon, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {leadingIcon}
        {children}
      </span>
    );
  },
);
Badge.displayName = "Badge";

export { badgeVariants };
