"use client";

/**
 * Meridian — Topbar
 *
 * Sticky header for any portal shell. Slots:
 *   leading  — back button / breadcrumbs
 *   search   — optional search input
 *   actions  — right-aligned controls (theme toggle, profile menu)
 */

import * as React from "react";
import { cn } from "@/lib/utils/cn";

interface TopbarProps extends React.HTMLAttributes<HTMLElement> {
  leading?: React.ReactNode;
  search?: React.ReactNode;
  actions?: React.ReactNode;
}

export const Topbar: React.FC<TopbarProps> = ({
  className,
  leading,
  search,
  actions,
  ...props
}) => {
  return (
    <header
      className={cn(
        "sticky top-0 z-header h-14 flex items-center gap-4",
        "bg-surface/80 backdrop-blur-sm border-b border-stroke",
        "px-6",
        className,
      )}
      {...props}
    >
      {leading && <div className="flex items-center gap-2">{leading}</div>}
      {search && <div className="flex-1 max-w-md mx-auto">{search}</div>}
      <div className={cn("flex items-center gap-2", !search && "ml-auto")}>
        {actions}
      </div>
    </header>
  );
};
