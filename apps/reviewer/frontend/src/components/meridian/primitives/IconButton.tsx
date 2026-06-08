"use client";

/**
 * Meridian — IconButton
 *
 * Square button optimized for icon-only affordances. Inherits the
 * Button variant system but renders a square footprint and enforces
 * an `aria-label` for accessibility.
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const iconButtonVariants = cva(
  [
    "inline-flex items-center justify-center",
    "transition-colors duration-fast ease-standard",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    "disabled:opacity-50 disabled:pointer-events-none",
    "active:scale-[0.96]",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: "bg-brand text-on-brand hover:bg-brand-hover shadow-sm",
        secondary:
          "bg-brand-secondary text-on-brand-secondary hover:bg-brand-secondary-hover",
        ghost:
          "bg-transparent text-text-secondary hover:bg-surface-hover hover:text-primary",
        outline:
          "bg-surface text-primary border border-stroke hover:border-stroke-strong hover:bg-surface-hover",
        danger: "bg-transparent text-error hover:bg-error-subtle",
      },
      size: {
        sm: "h-7 w-7 rounded-md",
        md: "h-9 w-9 rounded-lg",
        lg: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "md",
    },
  },
);

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">,
    VariantProps<typeof iconButtonVariants> {
  /** Required for accessibility — describes the action. */
  "aria-label": string;
  /** The icon to render — typically a lucide-react component. */
  icon: React.ReactNode;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, icon, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(iconButtonVariants({ variant, size }), className)}
        {...props}
      >
        {icon}
      </button>
    );
  },
);
IconButton.displayName = "IconButton";

export { iconButtonVariants };
