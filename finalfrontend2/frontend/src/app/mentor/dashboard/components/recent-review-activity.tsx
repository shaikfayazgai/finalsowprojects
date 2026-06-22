"use client";

import * as React from "react";
import {
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  RotateCcw,
  Lock,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { OperationalCard, SectionHeader } from "./operational-primitives";
import type { ReviewActivityEntry, ReviewActivityKind } from "@/mocks/data/mentor-workspace";

const kindMeta: Record<
  ReviewActivityKind,
  { label: string; icon: React.ElementType; dot: string; iconClass: string }
> = {
  approval: { label: "Approved", icon: CheckCircle2, dot: "bg-forest-500", iconClass: "text-forest-600" },
  rejection: { label: "Rejected", icon: XCircle, dot: "bg-red-500", iconClass: "text-red-600" },
  escalation: { label: "Escalated", icon: ArrowUpRight, dot: "bg-red-500", iconClass: "text-red-600" },
  rework: { label: "Rework", icon: RotateCcw, dot: "bg-gold-500", iconClass: "text-gold-600" },
  hold: { label: "On hold", icon: Lock, dot: "bg-brown-500", iconClass: "text-brown-600" },
  release: { label: "Released", icon: Undo2, dot: "bg-teal-500", iconClass: "text-teal-600" },
};

const filters: { key: ReviewActivityKind | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "approval", label: "Approvals" },
  { key: "rejection", label: "Rejections" },
  { key: "escalation", label: "Escalations" },
  { key: "rework", label: "Rework" },
];

export function RecentReviewActivity({ entries = [] }: { entries?: ReviewActivityEntry[] }) {
  const [filter, setFilter] = React.useState<ReviewActivityKind | "all">("all");

  const items =
    filter === "all"
      ? entries
      : entries.filter((a) => a.kind === filter);

  return (
    <OperationalCard padded={false} className="p-4">
      <div className="flex items-end justify-between gap-3 mb-3">
        <div>
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-gray-500">
            Recent Activity
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Operational decision log · last hours
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {filters.map((f) => {
            const count =
              f.key === "all"
                ? entries.length
                : entries.filter((a) => a.kind === f.key).length;
            const active = f.key === filter;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold transition-colors",
                  active
                    ? "border-forest-300 bg-forest-50 text-forest-700"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                )}
              >
                {f.label}
                <span className={cn("tabular-nums", active ? "text-forest-600" : "text-gray-400")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <ol className="divide-y divide-gray-100">
        {items.map((entry) => (
          <TimelineRow key={entry.id} entry={entry} />
        ))}
      </ol>
    </OperationalCard>
  );
}

function TimelineRow({ entry }: { entry: ReviewActivityEntry }) {
  const meta = kindMeta[entry.kind];
  const Icon = meta.icon;
  return (
    <li className="flex items-center gap-3 py-1.5 group hover:bg-gray-50/60 -mx-2 px-2 rounded-md transition-colors">
      <span className="text-[10.5px] font-mono text-gray-400 tabular-nums w-10 shrink-0">
        {entry.timestamp}
      </span>
      <span className="relative flex items-center justify-center shrink-0">
        <span className={cn("inline-block h-1.5 w-1.5 rounded-full", meta.dot)} />
      </span>
      <Icon className={cn("h-3 w-3 shrink-0", meta.iconClass)} />
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 w-20 shrink-0">
        {meta.label}
      </span>
      <span className="text-[12px] text-brown-950 font-medium truncate shrink-0 max-w-[40%]">
        {entry.subject}
      </span>
      <span className="text-[11.5px] text-gray-500 truncate flex-1">{entry.detail}</span>
      <span className="text-[10.5px] text-gray-400 shrink-0 hidden md:inline">{entry.actor}</span>
    </li>
  );
}
