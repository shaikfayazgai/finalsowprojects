/**
 * Meridian — Divider
 *
 * Horizontal or vertical separator. Three weights map to the stroke
 * token scale (subtle / default / strong). Use the `label` slot for
 * sectioning long content (e.g., "—— Yesterday ——").
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const dividerVariants = cva("", {
  variants: {
    orientation: {
      horizontal: "w-full h-px",
      vertical: "h-full w-px",
    },
    weight: {
      subtle: "bg-stroke-subtle",
      default: "bg-stroke",
      strong: "bg-stroke-strong",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
    weight: "default",
  },
});

export interface DividerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    VariantProps<typeof dividerVariants> {
  label?: string;
}

export const Divider: React.FC<DividerProps> = ({
  className,
  orientation = "horizontal",
  weight,
  label,
  ...props
}) => {
  if (label && orientation === "horizontal") {
    return (
      <div
        className={cn("flex items-center gap-3", className)}
        role="separator"
        {...props}
      >
        <div className={cn(dividerVariants({ orientation, weight }), "flex-1")} />
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">
          {label}
        </span>
        <div className={cn(dividerVariants({ orientation, weight }), "flex-1")} />
      </div>
    );
  }
  return (
    <div
      className={cn(dividerVariants({ orientation, weight }), className)}
      role="separator"
      aria-orientation={orientation ?? "horizontal"}
      {...props}
    />
  );
};
