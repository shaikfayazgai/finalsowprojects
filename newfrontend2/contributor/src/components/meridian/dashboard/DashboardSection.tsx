"use client";

/**
 * Meridian — DashboardSection (premium enterprise card)
 *
 * Section container for dashboard widgets. World-class enterprise
 * SaaS pattern:
 *
 *   ┌─────────────────────────────────────────────────┐
 *   │ Section title                  View all  →      │  ← strong title + link
 *   │ 17 SOWs across 5 lifecycle stages              │  ← optional description
 *   │ ──────────────────────────────────────────────  │  ← hairline divider
 *   │                                                 │
 *   │ [body]                                          │
 *   │                                                 │
 *   └─────────────────────────────────────────────────┘
 *
 * Active hover lifts the card slightly. No icon tile prefix (kept
 * minimal — typography carries the section identity).
 */

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface DashboardSectionProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  viewAllHref?: string;
  viewAllLabel?: string;
  /** Remove the surface card styling — children manage their own surface. */
  bare?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  eyebrow,
  title,
  description,
  actions,
  viewAllHref,
  viewAllLabel = "View all",
  bare,
  className,
  children,
}) => (
  <section
    className={cn(
      !bare && [
        "rounded-xl bg-surface border border-stroke-subtle",
        "transition-shadow duration-fast ease-standard",
      ],
      className,
    )}
  >
    <header
      className={cn(
        "flex items-start gap-3 flex-wrap",
        bare ? "mb-4" : "px-5 pt-4 pb-3 border-b border-stroke-subtle",
      )}
    >
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="font-body text-[10px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1">
            {eyebrow}
          </p>
        )}
        <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em] leading-tight truncate">
          {title}
        </h2>
        {description && (
          <p className="mt-1 font-body text-[12.5px] text-text-secondary leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {actions}
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className={cn(
              "inline-flex items-center gap-1 h-7 px-2.5 rounded-md",
              "font-body text-[12px] font-medium text-text-secondary",
              "hover:bg-surface-hover hover:text-foreground",
              "transition-colors duration-fast ease-standard",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
            )}
          >
            {viewAllLabel}
            <ArrowUpRight className="h-3 w-3" strokeWidth={2} aria-hidden />
          </Link>
        )}
      </div>
    </header>
    <div className={cn(bare ? "" : "p-5")}>{children}</div>
  </section>
);
