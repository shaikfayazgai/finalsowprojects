"use client";

/**
 * Meridian — Button
 *
 * The canonical action primitive. Six variants × four sizes,
 * loading + disabled states, optional icons. All styling resolves
 * through semantic tokens — no raw hex, no legacy palette.
 *
 * Variants:
 *   primary    — saffron filled, the highlighter; default action
 *   secondary  — ink filled, authority action
 *   tertiary   — verdigris filled, calm counterweight
 *   ghost      — transparent with stroke; the default secondary affordance
 *   danger     — claret filled; destructive actions only
 *   ai         — AI-tinted; for summoned AI actions
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  // Base — every button shares the same focus + rhythm
  [
    "inline-flex items-center justify-center gap-2 font-body font-semibold whitespace-nowrap",
    "transition-colors duration-fast ease-standard",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    "disabled:opacity-50 disabled:pointer-events-none",
    "active:scale-[0.985]",
    "select-none",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-[var(--color-on-primary)] hover:bg-brand-hover active:bg-brand-active shadow-sm hover:shadow-glow-primary",
        secondary:
          "bg-brand-secondary text-[var(--color-on-primary)] hover:bg-brand-secondary-hover shadow-sm",
        tertiary:
          "bg-brand-tertiary-strong text-[var(--color-on-primary)] hover:bg-brand-tertiary-hover shadow-sm",
        ghost:
          "bg-surface border border-stroke text-foreground hover:bg-surface-hover",
        danger:
          "bg-error-solid text-[var(--color-on-primary)] hover:bg-error shadow-sm",
        ai:
          "bg-ai-highlight text-ai-text border border-ai-border hover:bg-ai-border/40 shadow-glow-ai",
      },
      size: {
        sm: "h-8 px-3 text-body-sm rounded-md gap-1.5",
        md: "h-10 px-4 text-body-md rounded-lg",
        lg: "h-11 px-5 text-body-md rounded-lg",
        xl: "h-12 px-6 text-body-lg rounded-xl",
      },
      fullWidth: { true: "w-full" },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Show a spinner and disable interaction. */
  loading?: boolean;
  /** Icon rendered before the label. */
  leadingIcon?: React.ReactNode;
  /** Icon rendered after the label. */
  trailingIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading,
      disabled,
      leadingIcon,
      trailingIcon,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        disabled={disabled || loading}
        data-loading={loading || undefined}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          leadingIcon
        )}
        {children}
        {!loading && trailingIcon}
      </button>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
