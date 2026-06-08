"use client";

import * as React from "react";
import { ArrowRight, GitCompare, Minus, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorCard,
  ContributorSectionHeader,
} from "@/app/contributor/_shared/primitives";
import type { VersionComparisonRow } from "@/mocks/data/contributor-workroom-detail";

const stateTone = {
  present: { dot: "bg-forest-500", text: "text-forest-700", label: "Present" },
  partial: { dot: "bg-gold-500", text: "text-gold-700", label: "Partial" },
  missing: { dot: "bg-beige-400", text: "text-beige-700", label: "Missing" },
};

const movementBadge = {
  improved: {
    icon: TrendingUp,
    chip: "border-forest-200 bg-forest-50 text-forest-700",
    label: "Improved",
  },
  unchanged: {
    icon: Minus,
    chip: "border-beige-200 bg-beige-50 text-beige-700",
    label: "Unchanged",
  },
  regressed: {
    icon: Minus,
    chip: "border-brown-200 bg-brown-50 text-brown-700",
    label: "Regressed",
  },
  added: {
    icon: TrendingUp,
    chip: "border-teal-200 bg-teal-50 text-teal-700",
    label: "Added",
  },
  removed: {
    icon: Minus,
    chip: "border-beige-200 bg-beige-50 text-beige-700",
    label: "Removed",
  },
};

export function VersionComparison({
  rows,
  previousLabel,
  updatedLabel,
}: {
  rows: VersionComparisonRow[];
  previousLabel: string;
  updatedLabel: string;
}) {
  return (
    <ContributorCard padded={false} className="overflow-hidden">
      <div className="px-5 pt-5">
        <ContributorSectionHeader
          title="What changed between submissions"
          caption="Side-by-side delta across criteria, evidence, and deliverables."
          trailing={
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-800">
              <GitCompare className="h-3.5 w-3.5" />
              v1 → v2
            </span>
          }
        />
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-x-3 px-5 pb-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-beige-600">
        <span>{previousLabel}</span>
        <span className="text-center w-12">→</span>
        <span>{updatedLabel}</span>
      </div>

      <ul className="divide-y divide-beige-100">
        {rows.map((r) => {
          const prev = stateTone[r.previous.state];
          const next = stateTone[r.updated.state];
          const mv = movementBadge[r.movement];
          const Icon = mv.icon;
          return (
            <li key={r.id} className="px-5 py-3.5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-brown-950 leading-tight">
                    {r.label}
                  </p>
                  <p className="text-[10.5px] text-beige-600 mt-0.5 capitalize">{r.kind}</p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-[1px] text-[10px] font-semibold tracking-wide shrink-0",
                    mv.chip
                  )}
                >
                  <Icon className="h-2.5 w-2.5" />
                  {mv.label}
                </span>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-x-3">
                <div className="rounded-lg border border-beige-200 bg-beige-50/40 px-3 py-2">
                  <p className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold", prev.text)}>
                    <span className={cn("inline-block h-1.5 w-1.5 rounded-full", prev.dot)} />
                    {prev.label}
                  </p>
                  {r.previous.note && (
                    <p className="text-[11px] text-beige-700 mt-1 leading-snug">{r.previous.note}</p>
                  )}
                </div>
                <span className="self-center w-12 inline-flex items-center justify-center text-beige-400">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
                <div className="rounded-lg border border-teal-200 bg-teal-50/40 px-3 py-2">
                  <p className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold", next.text)}>
                    <span className={cn("inline-block h-1.5 w-1.5 rounded-full", next.dot)} />
                    {next.label}
                  </p>
                  {r.updated.note && (
                    <p className="text-[11px] text-brown-900 mt-1 leading-snug">{r.updated.note}</p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </ContributorCard>
  );
}
