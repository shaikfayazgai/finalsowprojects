"use client";

/**
 * Meridian — PageActionsContext
 *
 * A context-portal pattern so pages can register actions that render
 * in the topbar's right cluster instead of building a per-page header.
 *
 * Usage in a page:
 *
 *   import { usePageActions } from "@/components/meridian/shell";
 *
 *   export default function SowWorkspacePage() {
 *     usePageActions(
 *       <>
 *         <Button variant="ghost" size="sm">Export</Button>
 *         <Button variant="primary" size="sm">+ New SOW</Button>
 *       </>
 *     );
 *     return <PageBody />;
 *   }
 *
 * The topbar reads `usePageActionsValue()` to render whatever the
 * active page registered. Actions automatically clear on unmount.
 */

import * as React from "react";

interface PageActionsContextValue {
  actions: React.ReactNode;
  setActions: (actions: React.ReactNode) => void;
}

const PageActionsContext = React.createContext<PageActionsContextValue | null>(
  null,
);

export function PageActionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [actions, setActions] = React.useState<React.ReactNode>(null);
  const value = React.useMemo(
    () => ({ actions, setActions }),
    [actions],
  );
  return (
    <PageActionsContext.Provider value={value}>
      {children}
    </PageActionsContext.Provider>
  );
}

/**
 * Register actions to render in the topbar right cluster. Pass `null`
 * to clear. Actions are automatically cleared on unmount.
 */
export function usePageActions(actions: React.ReactNode | null): void {
  const ctx = React.useContext(PageActionsContext);
  React.useEffect(() => {
    if (!ctx) return;
    ctx.setActions(actions);
    return () => ctx.setActions(null);
  }, [actions, ctx]);
}

/** Read the currently-registered page actions. Used by the topbar. */
export function usePageActionsValue(): React.ReactNode {
  const ctx = React.useContext(PageActionsContext);
  return ctx?.actions ?? null;
}
