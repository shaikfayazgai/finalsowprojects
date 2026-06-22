/**
 * Meridian — ContentGrid + SplitPanel
 *
 * Layout primitives. ContentGrid drives the canonical KPI grid
 * (auto-fit, 2/3/5 columns); SplitPanel drives the canonical two-
 * column page layouts (main + sticky aside) used everywhere in the V2
 * Enterprise portal.
 */

import * as React from "react";
import { cn } from "@/lib/utils/cn";

interface ContentGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Auto-fit columns with a minimum tile width. */
  minTileWidth?: string;
  /** Explicit column count per breakpoint. */
  columns?: { base?: number; md?: number; lg?: number; xl?: number };
  gap?: "sm" | "md" | "lg";
}

const gapClass = {
  sm: "gap-2.5",
  md: "gap-3",
  lg: "gap-6",
} as const;

export const ContentGrid: React.FC<ContentGridProps> = ({
  className,
  minTileWidth,
  columns,
  gap = "md",
  style,
  children,
  ...props
}) => {
  const colClasses = columns
    ? cn(
        columns.base && `grid-cols-${columns.base}`,
        columns.md && `md:grid-cols-${columns.md}`,
        columns.lg && `lg:grid-cols-${columns.lg}`,
        columns.xl && `xl:grid-cols-${columns.xl}`,
      )
    : "";
  const inlineGrid = minTileWidth
    ? { gridTemplateColumns: `repeat(auto-fit, minmax(${minTileWidth}, 1fr))` }
    : undefined;
  return (
    <div
      className={cn("grid", gapClass[gap], colClasses, className)}
      style={{ ...inlineGrid, ...style }}
      {...props}
    >
      {children}
    </div>
  );
};

interface SplitPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Aside (right rail) content. */
  aside: React.ReactNode;
  /** Right rail width — defaults to 360px. */
  asideWidth?: number;
  /** Make the aside stick under the topbar (topbar 52 + 24 gap = 76px). */
  stickyAside?: boolean;
}

/**
 * Two-column layout: main + right rail. At xl+ the rail is fixed-width
 * and (by default) sticks below the topbar at 76px. Below xl, single
 * column with the aside flowing under the main content.
 *
 * Width comes through a CSS variable so the grid template is purely
 * media-query-driven via Tailwind's arbitrary value syntax — no inline
 * grid template that fires at every breakpoint.
 */
export const SplitPanel: React.FC<SplitPanelProps> = ({
  className,
  aside,
  asideWidth = 360,
  stickyAside = true,
  children,
  style,
  ...props
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 items-start",
        "xl:grid-cols-[minmax(0,1fr)_var(--meridian-aside-w)]",
        className,
      )}
      style={
        {
          "--meridian-aside-w": `${asideWidth}px`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <div className="min-w-0">{children}</div>
      <aside
        className={cn(stickyAside && "xl:sticky xl:top-[76px] self-start")}
      >
        {aside}
      </aside>
    </div>
  );
};
