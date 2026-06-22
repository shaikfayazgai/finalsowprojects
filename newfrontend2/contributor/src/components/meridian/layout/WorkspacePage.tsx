/**
 * Meridian — WorkspacePage (Prism)
 *
 * The high-level composable primitive for any operational page. Owns:
 *
 *   - The 24px vertical rhythm between header / body sections
 *   - Page-entry fade-in animation
 *   - Canonical two-layout binary: `stack` (full width) | `split`
 *     (main + sticky right rail at top-[76px])
 *
 * Use this instead of hand-rolling `<div className="space-y-6 …">` +
 * `grid grid-cols-1 xl:grid-cols-[…]` per page. Pages that adopt this
 * primitive automatically pick up future rhythm changes.
 *
 * Examples:
 *
 *   // 1. Simple stacked page
 *   <WorkspacePage header={<PageHeader title="Dashboard" />}>
 *     <KPISection />
 *     <ContentSection />
 *   </WorkspacePage>
 *
 *   // 2. Main + sticky right rail
 *   <WorkspacePage
 *     header={<PageHeader title="SOW Workspace" />}
 *     variant="split"
 *     aside={<SowDetailPanel />}
 *   >
 *     <SowListTable />
 *   </WorkspacePage>
 *
 *   // 3. Wider aside (substantial detail rail)
 *   <WorkspacePage variant="split" aside={…} asideWidth={420}>
 *     …
 *   </WorkspacePage>
 */

import * as React from "react";
import { cn } from "@/lib/utils/cn";

interface WorkspacePageProps extends React.HTMLAttributes<HTMLDivElement> {
  /** PageHeader (or any header node). Rendered above the body. */
  header?: React.ReactNode;
  /** Right rail content. Only rendered when `variant="split"`. */
  aside?: React.ReactNode;
  /** Right rail width in px — defaults to 360. */
  asideWidth?: number;
  /** Layout variant. `stack` = full width, `split` = main + aside. */
  variant?: "stack" | "split";
  /** Make the right rail sticky at top-[76px] on xl+ (default true). */
  stickyAside?: boolean;
}

export const WorkspacePage = React.forwardRef<
  HTMLDivElement,
  WorkspacePageProps
>(
  (
    {
      className,
      header,
      aside,
      asideWidth = 360,
      variant = "stack",
      stickyAside = true,
      children,
      style,
      ...props
    },
    ref,
  ) => {
    const isSplit = variant === "split" && aside;

    return (
      <div
        ref={ref}
        className={cn("space-y-6 animate-fade-in", className)}
        style={style}
        {...props}
      >
        {header}
        {isSplit ? (
          <div
            className={cn(
              "grid grid-cols-1 gap-6 items-start",
              "xl:grid-cols-[minmax(0,1fr)_var(--meridian-aside-w)]",
            )}
            style={
              {
                "--meridian-aside-w": `${asideWidth}px`,
              } as React.CSSProperties
            }
          >
            <div className="min-w-0 space-y-6">{children}</div>
            <aside
              className={cn(
                stickyAside && "xl:sticky xl:top-[76px] self-start",
              )}
            >
              {aside}
            </aside>
          </div>
        ) : (
          <div className="space-y-6">{children}</div>
        )}
      </div>
    );
  },
);
WorkspacePage.displayName = "WorkspacePage";
