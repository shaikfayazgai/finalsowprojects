"use client";

import * as React from "react";
import {
  CheckCircle2,
  Clock,
  ListChecks,
  MessageCircle,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  correctionStats,
  type RevisionRow,
  urgencyOf,
} from "@/mocks/data/contributor-revision-queue";

export type RevisionsFilter =
  | "all"
  | "feedback_received"
  | "in_correction"
  | "awaiting_clarification"
  | "ready_for_resubmission"
  | "due_soon";

export function RevisionsSummary({
  rows,
  filter,
  onChangeFilter,
}: {
  rows: RevisionRow[];
  filter: RevisionsFilter;
  onChangeFilter: (f: RevisionsFilter) => void;
}) {
  const open = rows.filter((r) => r.state !== "resubmitted_under_review").length;
  const dueSoon = rows.filter((r) => urgencyOf(r) === "due_today" || urgencyOf(r) === "due_soon").length;
  const awaitingClarification = rows.filter((r) => r.state === "awaiting_clarification").length;
  const readyToResubmit = rows.filter((r) => r.state === "ready_for_resubmission").length;
  const unresolvedTotal = rows.reduce((acc, r) => acc + correctionStats(r).unresolved, 0);

  const filterChips: { id: RevisionsFilter; label: string; count?: number }[] = [
    { id: "all", label: "All", count: rows.length },
    { id: "feedback_received", label: "Feedback received" },
    { id: "in_correction", label: "In correction" },
    { id: "awaiting_clarification", label: "Awaiting clarification", count: awaitingClarification },
    { id: "ready_for_resubmission", label: "Ready to resubmit", count: readyToResubmit },
    { id: "due_soon", label: "Due in 48h", count: dueSoon },
  ];

  return (
    <section className="rounded-2xl border border-beige-200 bg-gradient-to-br from-beige-50 via-white to-teal-50/30 overflow-hidden">
      <div className="px-6 py-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-teal-700">
            Work Execution · Revisions
          </p>
          <h1 className="font-heading text-[24px] font-semibold text-brown-950 leading-tight mt-1">
            Revisions workspace
          </h1>
          <p className="text-[13px] text-beige-700 mt-1 max-w-2xl leading-relaxed">
            Every task awaiting your correction work, in one operational view. Pick the one that needs you next.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-beige-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-beige-700">
            <ListChecks className="h-3.5 w-3.5" />
            {unresolvedTotal} unresolved corrections
          </span>
        </div>
      </div>

      <div className="px-6 pb-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi
          Icon={RotateCcw}
          label="Open revisions"
          value={open}
          helper="Across all current projects"
          tone="teal"
        />
        <Kpi
          Icon={Clock}
          label="Due in 48h"
          value={dueSoon}
          helper="Plan today around these"
          tone={dueSoon > 0 ? "gold" : "beige"}
        />
        <Kpi
          Icon={MessageCircle}
          label="Awaiting clarification"
          value={awaitingClarification}
          helper="SLA paused while mentor replies"
          tone={awaitingClarification > 0 ? "gold" : "beige"}
        />
        <Kpi
          Icon={CheckCircle2}
          label="Ready to resubmit"
          value={readyToResubmit}
          helper="Send when you're confident"
          tone={readyToResubmit > 0 ? "forest" : "beige"}
        />
      </div>

      <div className="px-6 py-3 border-t border-beige-200/70 bg-white/40 flex flex-wrap items-center gap-1.5">
        {filterChips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => onChangeFilter(chip.id)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors inline-flex items-center gap-1.5",
              filter === chip.id
                ? "border-teal-300 bg-teal-50 text-teal-800"
                : "border-beige-200 bg-white text-beige-700 hover:border-beige-300",
            )}
          >
            {chip.label}
            {typeof chip.count === "number" && (
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[16px] h-4 rounded-full text-[9.5px] font-bold tabular-nums px-1",
                  filter === chip.id
                    ? "bg-teal-600 text-white"
                    : "bg-beige-100 text-beige-700",
                )}
              >
                {chip.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

function Kpi({
  Icon,
  label,
  value,
  helper,
  tone,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  helper: string;
  tone: "teal" | "gold" | "forest" | "beige";
}) {
  const palette = {
    teal: { ring: "ring-teal-200 bg-teal-50", tint: "text-teal-700", border: "border-teal-200" },
    gold: { ring: "ring-gold-200 bg-gold-50", tint: "text-gold-800", border: "border-gold-200" },
    forest: { ring: "ring-forest-200 bg-forest-50", tint: "text-forest-700", border: "border-forest-200" },
    beige: { ring: "ring-beige-200 bg-beige-50", tint: "text-beige-700", border: "border-beige-200" },
  }[tone];
  return (
    <div className={cn("rounded-xl border bg-white px-3.5 py-3 flex items-start gap-2.5", palette.border)}>
      <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg ring-2 ring-white", palette.ring)}>
        <Icon className={cn("h-4 w-4", palette.tint)} />
      </span>
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-beige-600">
          {label}
        </p>
        <p className="font-heading text-[22px] font-semibold text-brown-950 tabular-nums leading-none mt-0.5">
          {value}
        </p>
        <p className="text-[10.5px] text-beige-600 mt-0.5 leading-snug">{helper}</p>
      </div>
    </div>
  );
}
