/**
 * Meridian — Card
 *
 * The canonical container primitive. Three variants:
 *   default  — surface + stroke + sm shadow (every list row, every panel)
 *   raised   — surface-raised + md shadow (modals, drawers internal)
 *   subtle   — bg-subtle, no shadow (sub-panels inside cards)
 *   ai       — ai-surface + ai-border + glow-ai (AI panels)
 *
 * Use the sub-primitives (CardHeader, CardBody, CardFooter) to keep
 * rhythm consistent across every card in the platform.
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const cardVariants = cva("rounded-2xl border overflow-hidden", {
  variants: {
    variant: {
      default: "bg-surface border-stroke shadow-sm",
      raised: "bg-surface-raised border-stroke shadow-md",
      subtle: "bg-bg-subtle border-stroke-subtle",
      ai: "bg-ai-surface border-ai-border shadow-glow-ai",
    },
    interactive: {
      true: "transition-shadow duration-base ease-standard hover:shadow-md cursor-pointer",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, interactive }), className)}
      {...props}
    />
  ),
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-5 py-4 border-b border-stroke-subtle flex items-start justify-between gap-3",
      className,
    )}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

export const CardBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5", className)} {...props} />
));
CardBody.displayName = "CardBody";

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-5 py-3 border-t border-stroke-subtle bg-bg-subtle/40",
      className,
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { cardVariants };
