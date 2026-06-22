"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  ChevronRight,
  MoreHorizontal,
  ArrowUpRight,
  Eye,
  RotateCcw,
  Flag,
  Pin,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui";
import {
  SlaIndicator,
  SeverityChip,
  ReviewStateChip,
  AiConfidenceBadge,
  OperationalCard,
} from "./operational-primitives";
import type { PriorityReviewRow, SlaTier } from "@/mocks/data/mentor-workspace";

type SegmentKey = "all" | "breached_critical" | "escalated" | "ai_ready" | "holds";

const segments: { key: SegmentKey; label: string; predicate: (r: PriorityReviewRow) => boolean }[] = [
  { key: "all", label: "All", predicate: () => true },
  {
    key: "breached_critical",
    label: "Breached + Critical",
    predicate: (r) => r.slaTier === "breached" || r.slaTier === "critical",
  },
  { key: "escalated", label: "Escalated", predicate: (r) => r.reviewState === "escalated" },
  { key: "ai_ready", label: "AI Ready", predicate: (r) => r.reviewState === "ai_ready" },
  { key: "holds", label: "Governance Holds", predicate: (r) => r.reviewState === "governance_hold" },
];

const slaOrder: Record<SlaTier, number> = {
  breached: 0,
  critical: 1,
  warning: 2,
  watch: 3,
  healthy: 4,
};

function formatAge(hours: number) {
  if (hours < 24) return `${hours}h`;
  const d = Math.floor(hours / 24);
  const h = hours % 24;
  return h ? `${d}d ${h}h` : `${d}d`;
}

function railTone(tier: SlaTier): string {
  switch (tier) {
    case "breached":
      return "bg-red-600";
    case "critical":
      return "bg-red-500";
    case "warning":
      return "bg-gold-500";
    case "watch":
      return "bg-teal-400";
    default:
      return "bg-gray-200";
  }
}

function rowTint(tier: SlaTier): string {
  if (tier === "breached") return "bg-red-50/30 hover:bg-red-50/60";
  if (tier === "critical") return "bg-red-50/15 hover:bg-red-50/40";
  if (tier === "warning") return "bg-gold-50/15 hover:bg-gold-50/40";
  return "hover:bg-gray-50/70";
}

function PriorityBadge({ index }: { index: number }) {
  if (index >= 3) return null;
  return (
    <span
      className={cn(
        "inline-flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold tabular-nums",
        index === 0
          ? "bg-red-600 text-white"
          : index === 1
          ? "bg-red-500 text-white"
          : "bg-gold-500 text-white"
      )}
      title={`Priority #${index + 1}`}
    >
      {index + 1}
    </span>
  );
}

export function PriorityReviewQueue({ rows = [] }: { rows?: PriorityReviewRow[] }) {
  const [segment, setSegment] = React.useState<SegmentKey>("all");
  const [query, setQuery] = React.useState("");
  const [activeRow, setActiveRow] = React.useState<PriorityReviewRow | null>(null);

  const { critical, normal } = React.useMemo(() => {
    const seg = segments.find((s) => s.key === segment) ?? segments[0];
    const filtered = rows
      .filter(seg.predicate)
      .filter((r) => {
        if (!query) return true;
        const q = query.toLowerCase();
        return (
          r.task.title.toLowerCase().includes(q) ||
          r.task.project.toLowerCase().includes(q) ||
          r.contributor.code.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => slaOrder[a.slaTier] - slaOrder[b.slaTier]);

    return {
      critical: filtered.filter((r) => r.slaTier === "breached" || r.slaTier === "critical"),
      normal: filtered.filter((r) => r.slaTier !== "breached" && r.slaTier !== "critical"),
    };
  }, [rows, segment, query]);

  const total = critical.length + normal.length;

  return (
    <OperationalCard padded={false} className="overflow-hidden">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
          <div>
            <h2 className="font-heading text-base font-semibold text-brown-950 leading-tight">
              Priority Review Queue
            </h2>
            <p className="text-[11.5px] text-gray-500 mt-0.5">
              <span className="font-semibold text-red-700 tabular-nums">{critical.length}</span> critical
              <span className="mx-1.5 text-gray-300">·</span>
              <span className="tabular-nums">{normal.length}</span> standard
              <span className="mx-1.5 text-gray-300">·</span>
              sorted by SLA urgency
            </p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs gap-1.5">
            Open full queue <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-3 px-5 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {segments.map((s) => {
              const count = rows.filter(s.predicate).length;
              const active = s.key === segment;
              const isCriticalChip = s.key === "breached_critical" && count > 0;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSegment(s.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition-colors",
                    active
                      ? isCriticalChip
                        ? "border-red-300 bg-red-50 text-red-700"
                        : "border-forest-300 bg-forest-50 text-forest-700"
                      : isCriticalChip
                      ? "border-red-200 bg-white text-red-700 hover:bg-red-50"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800"
                  )}
                >
                  {s.label}
                  <span
                    className={cn(
                      "tabular-nums",
                      active
                        ? isCriticalChip
                          ? "text-red-600"
                          : "text-forest-600"
                        : isCriticalChip
                        ? "text-red-500"
                        : "text-gray-400"
                    )}
                  >
                    {count}
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
                placeholder="Search task, contributor, project…"
                className="h-8 w-64 rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-xs text-gray-700 placeholder:text-gray-400 outline-none focus:border-forest-300 focus:ring-2 focus:ring-forest-100"
              />
            </div>
            <button className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-600 hover:border-gray-300 hover:text-gray-800">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Column header */}
      <div className="hidden md:grid grid-cols-[28px_104px_1.6fr_140px_88px_92px_104px_36px] gap-3 px-5 py-2 border-b border-gray-100 bg-gray-50/60 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
        <div />
        <div>SLA</div>
        <div>Task · Contributor</div>
        <div>Project</div>
        <div>Age</div>
        <div>State</div>
        <div>AI Conf.</div>
        <div className="text-right" />
      </div>

      {/* Critical block — pinned with subtle banner */}
      {critical.length > 0 && (
        <div className="border-b border-red-100 bg-red-50/20">
          <div className="flex items-center gap-2 px-5 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-red-700">
            <Pin className="h-3 w-3" />
            Pinned · breached & critical
          </div>
          <ul>
            {critical.map((row, i) => (
              <li key={row.id}>
                <QueueRow row={row} priorityIndex={i} onOpen={setActiveRow} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Standard rows */}
      <ul className="divide-y divide-gray-100">
        {total === 0 && (
          <li className="px-5 py-10 text-center text-sm text-gray-500">
            No items match this view. Try clearing filters.
          </li>
        )}
        {normal.map((row, i) => (
          <li key={row.id}>
            <QueueRow row={row} priorityIndex={critical.length + i} onOpen={setActiveRow} />
          </li>
        ))}
      </ul>

      <ReviewDetailDialog row={activeRow} onClose={() => setActiveRow(null)} />
    </OperationalCard>
  );
}

function QueueRow({
  row,
  priorityIndex,
  onOpen,
}: {
  row: PriorityReviewRow;
  priorityIndex: number;
  onOpen: (r: PriorityReviewRow) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(row)}
      className={cn(
        "relative w-full text-left pl-5 pr-5 py-3 transition-colors grid md:grid-cols-[28px_104px_1.6fr_140px_88px_92px_104px_36px] grid-cols-1 gap-3 items-center",
        rowTint(row.slaTier)
      )}
    >
      {/* Severity left rail */}
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full",
          railTone(row.slaTier)
        )}
      />

      {/* Priority badge */}
      <div>
        <PriorityBadge index={priorityIndex} />
      </div>

      {/* SLA dominant column */}
      <div className="flex flex-col gap-0.5">
        <SlaIndicator tier={row.slaTier} remainingHours={row.slaRemainingHours} />
        <span className="text-[10px] text-gray-500 tabular-nums">
          age {formatAge(row.submissionAgeHours)}
        </span>
      </div>

      {/* Task + contributor */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[13px] font-semibold text-brown-950 truncate">
            {row.task.title}
          </p>
          {row.task.round && row.task.round > 1 && (
            <span className="inline-flex items-center rounded border border-gold-200 bg-gold-50 px-1.5 py-[1px] text-[10px] font-semibold text-gold-700">
              R{row.task.round}
            </span>
          )}
          {row.flags.includes("ai-ready") && (
            <span className="inline-flex items-center rounded border border-forest-200 bg-forest-50 px-1.5 py-[1px] text-[10px] font-semibold text-forest-700">
              AI ready
            </span>
          )}
          {row.flags.includes("plagiarism") && (
            <span className="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-1.5 py-[1px] text-[10px] font-semibold text-red-700">
              <Flag className="h-2.5 w-2.5" />
              Plag
            </span>
          )}
          <SeverityChip severity={row.riskSeverity} />
        </div>
        <p className="mt-0.5 text-[11.5px] text-gray-500">
          {row.contributor.code} · reliability{" "}
          <span
            className={cn(
              "font-semibold tabular-nums",
              row.contributor.reliability >= 80
                ? "text-forest-700"
                : row.contributor.reliability >= 65
                ? "text-gold-700"
                : "text-red-700"
            )}
          >
            {row.contributor.reliability}
          </span>
        </p>
      </div>

      <div className="text-[12px] text-gray-700 truncate">{row.task.project}</div>
      <div className="text-[12px] text-gray-700 tabular-nums">{formatAge(row.submissionAgeHours)}</div>
      <div>
        <ReviewStateChip state={row.reviewState} />
      </div>
      <div>
        <AiConfidenceBadge value={row.aiConfidence} band={row.aiConfidenceBand} />
      </div>
      <div className="text-right text-gray-400">
        <ChevronRight className="h-4 w-4 ml-auto" />
      </div>
    </button>
  );
}

function ReviewDetailDialog({
  row,
  onClose,
}: {
  row: PriorityReviewRow | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const open = !!row;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        {row && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <ReviewStateChip state={row.reviewState} />
                <SeverityChip severity={row.riskSeverity} />
                <SlaIndicator tier={row.slaTier} remainingHours={row.slaRemainingHours} />
              </div>
              <DialogTitle className="mt-2">{row.task.title}</DialogTitle>
              <DialogDescription>
                {row.task.project} · {row.contributor.code} · reliability {row.contributor.reliability}
                {row.task.round ? ` · round ${row.task.round}` : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Submission age
                </p>
                <p className="mt-1 font-semibold text-brown-950">{formatAge(row.submissionAgeHours)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  AI confidence
                </p>
                <div className="mt-1">
                  <AiConfidenceBadge value={row.aiConfidence} band={row.aiConfidenceBand} />
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 p-3 col-span-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Flags
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {row.flags.length === 0 && (
                    <span className="text-xs text-gray-500">No flags raised.</span>
                  )}
                  {row.flags.map((f) => (
                    <span
                      key={f}
                      className="inline-flex items-center rounded border border-gray-200 bg-gray-50 px-1.5 py-[1px] text-[11px] text-gray-700"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="!flex !flex-row !justify-between gap-2 pt-2">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                Request rework
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    onClose();
                    router.push(`/mentor/reviews/${row.id}`);
                  }}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Open review
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    onClose();
                    router.push(`/mentor/reviews/${row.id}`);
                  }}
                >
                  Claim &amp; start
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export const _RowMenuIcon = MoreHorizontal;
