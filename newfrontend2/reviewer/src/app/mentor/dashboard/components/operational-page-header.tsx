"use client";

import * as React from "react";
import { Bell, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui";

interface OperationalPageHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional set of context filters (e.g., enterprise / portfolio / time range). */
  contextFilters?: React.ReactNode;
  /** Optional trailing actions. */
  actions?: React.ReactNode;
}

/**
 * Reusable operational header for mentor workspace pages.
 * Sticky so context filters remain visible while the operator scrolls.
 */
export function OperationalPageHeader({
  title,
  subtitle,
  contextFilters,
  actions,
}: OperationalPageHeaderProps) {
  return (
    <div className="sticky top-0 z-20 -mx-8 px-8 pt-2 pb-3 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: "linear-gradient(135deg,#A67763,#8B5E4A)" }}
              aria-hidden
            />
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-gray-500">
              Mentor Workspace
            </p>
          </div>
          <h1 className="font-heading text-[22px] font-semibold text-brown-950 leading-tight mt-1">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[12.5px] text-gray-600 mt-1 leading-snug max-w-3xl">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {actions ?? (
            <>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Bell className="h-3.5 w-3.5" /> Alerts
              </Button>
            </>
          )}
        </div>
      </div>

      {contextFilters && (
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
            <Filter className="h-3 w-3" /> Context
          </span>
          {contextFilters}
        </div>
      )}
    </div>
  );
}

export function ContextChip({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-colors " +
        (active
          ? "border-forest-300 bg-forest-50 text-forest-700"
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300")
      }
    >
      <span className="text-gray-400">{label}:</span>
      <span className="font-semibold">{value ?? "All"}</span>
    </button>
  );
}
