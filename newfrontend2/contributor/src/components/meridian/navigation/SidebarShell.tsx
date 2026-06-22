"use client";

/**
 * Meridian — SidebarShell + SidebarItem
 *
 * Editorial enterprise sidebar. Sections + items, collapsible (Phase
 * 3), active-state via `aria-current`. Item routing is delegated —
 * pass any `href`-bearing element (Link, etc.) via `as`.
 */

import * as React from "react";
import { cn } from "@/lib/utils/cn";

interface SidebarSection {
  title?: string;
  items: SidebarItemModel[];
  primary?: boolean;
}

export interface SidebarItemModel {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  badge?: React.ReactNode;
  active?: boolean;
}

interface SidebarShellProps {
  brand?: React.ReactNode;
  sections: SidebarSection[];
  footer?: React.ReactNode;
  className?: string;
  /** Render-prop: lets the caller wrap each item with their router Link. */
  renderItem?: (item: SidebarItemModel, content: React.ReactNode) => React.ReactNode;
}

export const SidebarShell: React.FC<SidebarShellProps> = ({
  brand,
  sections,
  footer,
  className,
  renderItem,
}) => {
  return (
    <nav
      aria-label="Primary navigation"
      className={cn(
        "h-screen sticky top-0 flex flex-col w-60 shrink-0",
        "bg-surface border-r border-stroke",
        "z-sidebar",
        className,
      )}
    >
      {brand && (
        <div className="px-4 py-4 border-b border-stroke-subtle">{brand}</div>
      )}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
        {sections.map((section, idx) => (
          <div key={section.title ?? idx}>
            {section.title && (
              <p
                className={cn(
                  "px-2 mb-1.5 font-body text-[10.5px] font-semibold uppercase tracking-[0.16em]",
                  section.primary ? "text-primary" : "text-text-tertiary",
                )}
              >
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const inner = <SidebarItem item={item} />;
                return (
                  <li key={item.id}>
                    {renderItem ? renderItem(item, inner) : inner}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      {footer && (
        <div className="px-2 py-3 border-t border-stroke-subtle">{footer}</div>
      )}
    </nav>
  );
};

export const SidebarItem: React.FC<{ item: SidebarItemModel }> = ({ item }) => {
  return (
    <span
      aria-current={item.active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 px-2.5 py-1.5 rounded-md font-body text-body-sm",
        "transition-colors duration-fast ease-standard",
        item.active
          ? "bg-brand-subtle text-brand-subtle-text font-semibold"
          : "text-text-secondary hover:bg-surface-hover hover:text-primary",
      )}
    >
      {item.icon && <span aria-hidden className="shrink-0">{item.icon}</span>}
      <span className="truncate flex-1">{item.label}</span>
      {item.badge}
    </span>
  );
};
