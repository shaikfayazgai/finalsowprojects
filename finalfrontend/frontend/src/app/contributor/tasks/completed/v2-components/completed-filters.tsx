"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorCard,
} from "@/app/contributor/_shared/primitives";

export interface CompletedFilters {
  query: string;
  project: string | "all";
  skill: string | "all";
  yearMonth: string | "all";
  view: "all" | "portfolio" | "credentials" | "first_try";
}

export function CompletedFiltersBar({
  filters,
  onChange,
  projects,
  skills,
  yearMonths,
  count,
}: {
  filters: CompletedFilters;
  onChange: (f: CompletedFilters) => void;
  projects: string[];
  skills: string[];
  yearMonths: string[];
  count: number;
}) {
  return (
    <ContributorCard padded={false}>
      <div className="px-4 py-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-beige-500" />
          <input
            type="search"
            placeholder="Search delivered work…"
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            className="w-full rounded-lg border border-beige-200 bg-white pl-8 pr-7 py-1.5 text-[12.5px] text-brown-950 placeholder:text-beige-500 focus:outline-none focus:border-teal-300 focus:bg-teal-50/20"
          />
          {filters.query && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, query: "" })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-beige-500 hover:text-brown-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Select
          label="Project"
          value={filters.project}
          options={["all", ...projects]}
          onChange={(v) => onChange({ ...filters, project: v })}
        />
        <Select
          label="Skill"
          value={filters.skill}
          options={["all", ...skills]}
          onChange={(v) => onChange({ ...filters, skill: v })}
        />
        <Select
          label="Month"
          value={filters.yearMonth}
          options={["all", ...yearMonths]}
          onChange={(v) => onChange({ ...filters, yearMonth: v })}
          formatLabel={(v) => (v === "all" ? "All" : formatYearMonth(v))}
        />
        <span className="ml-auto text-[11px] text-beige-700 tabular-nums">
          <strong className="text-brown-900">{count}</strong> result{count === 1 ? "" : "s"}
        </span>
      </div>

      <div className="px-4 pb-3 flex flex-wrap items-center gap-1.5">
        {[
          { id: "all" as const, label: "All accepted" },
          { id: "first_try" as const, label: "First-try" },
          { id: "credentials" as const, label: "With credentials" },
          { id: "portfolio" as const, label: "Portfolio-eligible" },
        ].map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onChange({ ...filters, view: v.id })}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
              filters.view === v.id
                ? "border-teal-300 bg-teal-50 text-teal-800"
                : "border-beige-200 bg-white text-beige-700 hover:border-beige-300",
            )}
          >
            {v.label}
          </button>
        ))}
      </div>
    </ContributorCard>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
  formatLabel,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  formatLabel?: (v: string) => string;
}) {
  return (
    <label className="inline-flex items-center gap-1.5 rounded-lg border border-beige-200 bg-white px-2.5 py-1.5">
      <span className="text-[10.5px] font-semibold uppercase tracking-wide text-beige-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-[12px] font-semibold text-brown-950 bg-transparent focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {formatLabel ? formatLabel(o) : o === "all" ? "All" : o}
          </option>
        ))}
      </select>
    </label>
  );
}

function formatYearMonth(ym: string): string {
  const [y, m] = ym.split("-");
  return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(m) - 1]} ${y}`;
}
