"use client";

/**
 * Meridian — Tabs
 *
 * Underline-tab pattern. Active tab carries a saffron underline; idle
 * tabs sit in tertiary text color. Supports leading icons.
 *
 * Keyboard:
 *   ArrowLeft / ArrowRight — move focus
 *   Home / End             — first / last
 *   Enter / Space          — activate
 */

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  /** Compact mode reduces vertical padding for table toolbars. */
  compact?: boolean;
  className?: string;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  compact,
  className,
}: TabsProps<T>) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, idx: number) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = items[(idx + 1) % items.length];
      onChange(next.id);
      focusTab(idx + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = items[(idx - 1 + items.length) % items.length];
      onChange(prev.id);
      focusTab(idx - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange(items[0].id);
      focusTab(0);
    } else if (e.key === "End") {
      e.preventDefault();
      onChange(items[items.length - 1].id);
      focusTab(items.length - 1);
    }
  }

  function focusTab(idx: number) {
    const list = containerRef.current?.querySelectorAll<HTMLButtonElement>(
      '[role="tab"]',
    );
    if (!list) return;
    const real = ((idx % list.length) + list.length) % list.length;
    list[real]?.focus();
  }

  return (
    <div
      ref={containerRef}
      role="tablist"
      className={cn(
        "flex items-center gap-1 border-b border-stroke overflow-x-auto",
        className,
      )}
    >
      {items.map((tab, idx) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-t-lg font-body font-semibold transition-colors duration-fast ease-standard border-b-2 -mb-px",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:rounded-md",
              compact ? "px-2.5 py-1.5 text-body-sm" : "px-3 py-2 text-body-md",
              active
                ? "border-brand text-primary bg-brand-subtle/40"
                : "border-transparent text-text-secondary hover:text-primary hover:bg-surface-hover",
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.badge}
          </button>
        );
      })}
    </div>
  );
}
