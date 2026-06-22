/**
 * Meridian — Skeleton (LoadingSkeleton)
 *
 * Subtle shimmer placeholder. Use the variants for the most common
 * shapes:
 *   line   — single-line text placeholder
 *   block  — rectangular block (card body, image)
 *   avatar — circular
 *   chip   — pill (status placeholder)
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const skeletonVariants = cva(
  "relative overflow-hidden bg-bg-subtle isolate",
  {
    variants: {
      shape: {
        line: "h-3 rounded-md",
        block: "rounded-xl",
        avatar: "rounded-full",
        chip: "h-5 rounded-full",
      },
    },
    defaultVariants: { shape: "line" },
  },
);

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  /** Width in tailwind class form (e.g. "w-24") or any utility. */
  width?: string;
  /** Height in tailwind class form (overrides shape default). */
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  shape,
  width,
  height,
  style,
  ...props
}) => {
  return (
    <div
      aria-hidden
      className={cn(skeletonVariants({ shape }), width, height, className)}
      style={style}
      {...props}
    >
      <span
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-surface-hover/70 to-transparent"
        style={{
          animation: "meridian-shimmer 1.6s var(--ease-in-out) infinite",
        }}
      />
    </div>
  );
};
