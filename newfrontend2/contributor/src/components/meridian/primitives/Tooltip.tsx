"use client";

/**
 * Meridian — Tooltip
 *
 * Lightweight hover/focus tooltip. Positioned via CSS only (top / right
 * / bottom / left) — no portal needed for the common case. For
 * complex positioning (collision avoidance, virtual elements) reach for
 * a headless tooltip library in Phase 3.
 *
 * Honors keyboard focus + `prefers-reduced-motion` via the motion
 * token transitions.
 */

import * as React from "react";
import { cn } from "@/lib/utils/cn";

type Side = "top" | "right" | "bottom" | "left";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: Side;
  delay?: number;
  /** When false, render children without tooltip behavior. */
  enabled?: boolean;
}

const sideClass: Record<Side, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

export function Tooltip({
  content,
  children,
  side = "top",
  delay = 250,
  enabled = true,
}: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = () => {
    if (!enabled) return;
    timeoutRef.current = setTimeout(() => setOpen(true), delay);
  };
  const handleLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(false);
  };

  if (!enabled) return children;

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocusCapture={handleEnter}
      onBlurCapture={handleLeave}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={cn(
            "absolute z-popover px-2 py-1 rounded-md text-[11px] font-body font-medium",
            "bg-surface-inverse text-text-inverse shadow-md",
            "whitespace-nowrap pointer-events-none",
            sideClass[side],
          )}
          style={{ animation: "meridian-fade-in var(--duration-fast) var(--ease-standard)" }}
        >
          {content}
        </span>
      )}
    </span>
  );
}
