/**
 * Meridian — PageShell
 *
 * Slim convenience wrapper for an operational page. Provides the
 * canonical 24px section rhythm and the page-entry fade-in animation.
 * The shell already owns horizontal padding, max-width, and bottom
 * padding, so PageShell adds NO padding of its own.
 *
 * Most pages should prefer the higher-level `WorkspacePage` primitive
 * (handles header + body + optional sticky aside). Use PageShell when
 * you just need the rhythm without the header composition.
 *
 *   <PageShell>
 *     <PageHeader … />
 *     <Section … />
 *   </PageShell>
 */

import * as React from "react";
import { cn } from "@/lib/utils/cn";

interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Constrain content width — defaults to none (fills shell canvas). */
  maxWidth?: "lg" | "xl" | "2xl" | "3xl" | "full";
}

const widthClass: Record<NonNullable<PageShellProps["maxWidth"]>, string> = {
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  full: "",
};

export const PageShell = React.forwardRef<HTMLDivElement, PageShellProps>(
  ({ className, maxWidth = "full", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "space-y-6",
          maxWidth !== "full" && cn(widthClass[maxWidth], "mx-auto"),
          className,
        )}
        style={{
          animation:
            "meridian-fade-up var(--duration-slow) var(--ease-standard) both",
        }}
        {...props}
      >
        {children}
      </div>
    );
  },
);
PageShell.displayName = "PageShell";
