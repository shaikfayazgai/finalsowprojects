"use client";

import * as React from "react";
import {
  ArrowRight,
  Clock,
  ListChecks,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorCard,
  ContributorSectionHeader,
  ReadinessBar,
} from "@/app/contributor/_shared/primitives";
import {
  correctionStats,
  formatHoursToDue,
  stateTone as workflowStateTone,
  urgencyOf,
  type RevisionRow,
} from "@/mocks/data/contributor-revision-queue";

export function RevisionsQueueTable({
  rows,
  selectedId,
  onSelect,
  onOpen,
}: {
  rows: RevisionRow[];
  selectedId?: string;
  onSelect: (row: RevisionRow) => void;
  onOpen: (row: RevisionRow) => void;
}) {
  return (
    <ContributorCard padded={false}>
      <div className="px-5 pt-5">
        <ContributorSectionHeader
          title="Revision queue"
          caption="Pick the one that needs you next. The selected row shows full mentor context on the right."
          trailing={
            <span className="inline-flex items-center gap-1.5 rounded-full border border-beige-200 bg-beige-50 px-2.5 py-1 text-[11px] font-semibold text-beige-700">
              <ListChecks className="h-3.5 w-3.5" />
              {rows.length} rows
            </span>
          }
        />
      </div>

      {/* Column header */}
      <div className="px-5 py-2 grid grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-3 items-center text-[10.5px] font-bold uppercase tracking-[0.14em] text-beige-500 border-y border-beige-100 bg-beige-50/30">
        <span>Task · mentor</span>
        <span>State</span>
        <span>Round</span>
        <span>Due</span>
        <span>Corrections</span>
        <span>Next action</span>
        <span className="w-6" />
      </div>

      {rows.length === 0 && (
        <div className="px-5 py-10 text-center">
          <p className="font-heading text-[14px] font-semibold text-brown-950">
            Nothing here to revise
          </p>
          <p className="text-[12.5px] text-beige-700 mt-1">
            Either your work is all accepted, or no mentor has flagged a revision yet.
          </p>
        </div>
      )}

      <ul className="divide-y divide-beige-200/60">
        {rows.map((r) => {
          const isSelected = r.id === selectedId;
          const stats = correctionStats(r);
          const wfTone = workflowStateTone(r.state);
          const urgency = urgencyOf(r);
          const dueTone =
            urgency === "due_today"
              ? "text-gold-800"
              : urgency === "due_soon"
              ? "text-teal-700"
              : urgency === "submitted"
              ? "text-beige-500"
              : "text-beige-700";

          return (
            <li
              key={r.id}
              className={cn(
                "px-5 py-3.5 grid grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-3 items-center cursor-pointer transition-colors",
                isSelected
                  ? "bg-teal-50/50 border-l-2 border-l-teal-500"
                  : "hover:bg-beige-50/50 border-l-2 border-l-transparent",
              )}
              onClick={() => onSelect(r)}
            >
              {/* Task + mentor */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-1.5 py-[1px] text-[9.5px] font-bold uppercase tracking-wide",
                      r.priority === "P0"
                        ? "border-brown-200 bg-brown-50 text-brown-700"
                        : r.priority === "P1"
                        ? "border-beige-200 bg-beige-50 text-beige-700"
                        : "border-beige-200 bg-beige-50 text-beige-600",
                    )}
                  >
                    {r.priority}
                  </span>
                  <p className="font-heading text-[13px] font-semibold text-brown-950 leading-tight truncate">
                    {r.title}
                  </p>
                </div>
                <p className="text-[11px] text-beige-700 flex items-center gap-1.5 truncate">
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-brown-100 text-brown-700 text-[9px] font-bold shrink-0">
                    {r.mentor.initials}
                  </span>
                  {r.mentor.name}
                  <span className="text-beige-300">·</span>
                  <span className="text-beige-600 truncate">{r.project}</span>
                </p>
              </div>

              {/* State */}
              <div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2 py-[1px] text-[10px] font-semibold tracking-wide",
                    wfTone.chip,
                  )}
                >
                  <span className={cn("inline-block h-1.5 w-1.5 rounded-full", wfTone.dot)} />
                  {wfTone.label}
                </span>
              </div>

              {/* Round */}
              <div className="text-[11.5px] text-brown-900 tabular-nums">
                <span className="inline-flex items-center gap-1 rounded-md border border-beige-200 bg-white px-1.5 py-[1px] font-semibold">
                  <RefreshCw className="h-2.5 w-2.5 text-beige-500" />
                  {r.reworkRound}/{r.totalRounds}
                </span>
              </div>

              {/* Due */}
              <div className="min-w-0">
                <p className={cn("inline-flex items-center gap-1 text-[11.5px] font-semibold tabular-nums", dueTone)}>
                  <Clock className="h-3 w-3" />
                  {formatHoursToDue(r.hoursToDue)}
                </p>
                <p className="text-[10.5px] text-beige-600 mt-0.5 truncate">{r.dueAt}</p>
              </div>

              {/* Corrections progress */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[11.5px] text-brown-900 tabular-nums shrink-0">
                    <strong>{stats.resolved}</strong>
                    <span className="text-beige-400"> / </span>
                    {stats.total}
                  </p>
                  <ReadinessBar value={stats.pct} size="sm" />
                </div>
                {stats.unresolved > 0 ? (
                  <p className="text-[10.5px] text-beige-700 truncate">
                    {stats.unresolved} unresolved
                  </p>
                ) : (
                  <p className="text-[10.5px] text-forest-700 truncate">All addressed</p>
                )}
              </div>

              {/* Next action */}
              <div className="min-w-0">
                <p className="text-[11.5px] text-brown-900 leading-snug truncate">
                  {r.nextRequiredAction}
                </p>
              </div>

              {/* Open */}
              <div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen(r);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-beige-200 bg-white px-2 py-1 text-[11px] font-semibold text-brown-900 hover:border-teal-300 hover:bg-teal-50/40 transition-colors"
                  title="Open revision workspace"
                >
                  Open
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </ContributorCard>
  );
}
