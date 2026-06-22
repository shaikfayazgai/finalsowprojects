"use client";

import * as React from "react";
import { Search, SlidersHorizontal, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface WorkflowQueueColumn<T> {
  key: string;
  label: string;
  width?: string;
  align?: "left" | "right";
  render: (row: T) => React.ReactNode;
}

interface WorkflowQueueProps<T> {
  title: string;
  caption?: string;
  rows: T[];
  columns: WorkflowQueueColumn<T>[];
  segments?: { key: string; label: string; count: number; predicate: (row: T) => boolean; tone?: "danger" | "default" }[];
  activeSegment?: string;
  onSegment?: (key: string) => void;
  onSelectRow?: (row: T) => void;
  rowKey: (row: T) => string;
  rowRailTone?: (row: T) => string;
  emptyLabel?: string;
  trailing?: React.ReactNode;
}

/**
 * Reusable governance workflow table. Powers the Rework, Escalated, and
 * Governance Holds list pages with one visual grammar:
 *   header → segment chips → search + filter → scan-friendly rows with
 *   severity rail → click into detail drawer.
 *
 * Generic over the row type so each consumer keeps its own columns and
 * filtering logic without duplicating the chrome.
 */
export function WorkflowQueue<T>({
  title,
  caption,
  rows,
  columns,
  segments = [],
  activeSegment,
  onSegment,
  onSelectRow,
  rowKey,
  rowRailTone,
  emptyLabel = "No items in this view.",
  trailing,
}: WorkflowQueueProps<T>) {
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) =>
      columns.some((c) => {
        const v = c.render(r);
        if (typeof v === "string") return v.toLowerCase().includes(q);
        return false;
      })
    );
  }, [rows, query, columns]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-end justify-between gap-3 px-5 pt-4 pb-3">
          <div>
            <h2 className="font-heading text-base font-semibold text-brown-950 leading-tight">{title}</h2>
            {caption && <p className="text-[11.5px] text-gray-500 mt-0.5">{caption}</p>}
          </div>
          {trailing}
        </div>

        <div className="flex items-center gap-3 px-5 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {segments.map((s) => {
              const active = s.key === activeSegment;
              const danger = s.tone === "danger" && s.count > 0;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => onSegment?.(s.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition-colors",
                    active
                      ? danger
                        ? "border-red-300 bg-red-50 text-red-700"
                        : "border-forest-300 bg-forest-50 text-forest-700"
                      : danger
                      ? "border-red-200 bg-white text-red-700 hover:bg-red-50"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  )}
                >
                  {s.label}
                  <span className={cn("tabular-nums", active ? (danger ? "text-red-600" : "text-forest-600") : danger ? "text-red-500" : "text-gray-400")}>
                    {s.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="h-8 w-60 rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-xs text-gray-700 outline-none focus:border-brown-300 focus:ring-2 focus:ring-brown-100"
              />
            </div>
            <button className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-600 hover:border-gray-300 hover:text-gray-800">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </button>
          </div>
        </div>
      </div>

      <div
        className="hidden md:grid gap-3 px-5 py-2 border-b border-gray-100 bg-gray-50/60 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500"
        style={{ gridTemplateColumns: gridColumns(columns) }}
      >
        <div />
        {columns.map((c) => (
          <div key={c.key} className={c.align === "right" ? "text-right" : ""}>
            {c.label}
          </div>
        ))}
        <div />
      </div>

      <ul className="divide-y divide-gray-100">
        {filtered.length === 0 && (
          <li className="px-5 py-10 text-center text-sm text-gray-500">{emptyLabel}</li>
        )}
        {filtered.map((row) => (
          <li key={rowKey(row)}>
            <button
              type="button"
              onClick={() => onSelectRow?.(row)}
              className="relative w-full text-left px-5 py-3 hover:bg-gray-50/70 grid md:grid-cols-[var(--cols)] grid-cols-1 gap-3 items-center transition-colors"
              style={{ ["--cols" as never]: gridColumns(columns) }}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full",
                  rowRailTone ? rowRailTone(row) : "bg-gray-200"
                )}
              />
              <div />
              {columns.map((c) => (
                <div key={c.key} className={cn(c.align === "right" && "text-right")}>
                  {c.render(row)}
                </div>
              ))}
              <div className="text-right text-gray-400">
                <ChevronRight className="h-4 w-4 ml-auto" />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function gridColumns<T>(columns: WorkflowQueueColumn<T>[]): string {
  return ["18px", ...columns.map((c) => c.width ?? "minmax(0,1fr)"), "24px"].join(" ");
}
