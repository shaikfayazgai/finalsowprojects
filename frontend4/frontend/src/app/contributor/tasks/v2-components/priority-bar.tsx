"use client";

import * as React from "react";
import {
  Clock,
  PlayCircle,
  Pause,
  MessageCircleQuestion,
  RotateCcw,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ContributorTask } from "@/mocks/data/contributor-workspace";
import { useContributorTaskList } from "@/lib/contributor/use-contributor-tasks";

export type WorkloadBucketKey =
  | "due_soon"
  | "ready_to_start"
  | "blocked"
  | "awaiting"
  | "revision"
  | "ai_recommended";

export interface WorkloadBucket {
  key: WorkloadBucketKey;
  label: string;
  caption: string;
  Icon: LucideIcon;
  tone: "warm" | "info" | "soft" | "muted" | "accent";
  predicate: (t: ContributorTask) => boolean;
}

export const workloadBuckets: WorkloadBucket[] = [
  {
    key: "due_soon",
    label: "Due soon",
    caption: "Next 24 hours",
    Icon: Clock,
    tone: "warm",
    predicate: (t) =>
      t.deadlineHoursRemaining > 0 &&
      t.deadlineHoursRemaining <= 24 &&
      ["assigned", "accepted", "in_progress", "awaiting_clarification", "ready_for_submission"].includes(t.state),
  },
  {
    key: "ready_to_start",
    label: "Ready to start",
    caption: "Accepted or newly assigned",
    Icon: PlayCircle,
    tone: "accent",
    predicate: (t) => t.state === "assigned" || t.state === "accepted",
  },
  {
    key: "blocked",
    label: "Paused",
    caption: "Outside your control",
    Icon: Pause,
    tone: "muted",
    predicate: (t) => t.state === "blocked",
  },
  {
    key: "awaiting",
    label: "Awaiting reply",
    caption: "From mentors",
    Icon: MessageCircleQuestion,
    tone: "soft",
    predicate: (t) => t.state === "awaiting_clarification",
  },
  {
    key: "revision",
    label: "Revisions",
    caption: "Polish notes received",
    Icon: RotateCcw,
    tone: "warm",
    predicate: (t) => t.state === "revision_requested",
  },
  {
    key: "ai_recommended",
    label: "AI recommended",
    caption: "Best next to tackle",
    Icon: Sparkles,
    tone: "accent",
    predicate: (t) => {
      // Mock heuristic: AI-recommended = ready-to-submit OR high-progress with no blockers
      return (
        t.state === "ready_for_submission" ||
        (t.progressPct >= 50 && t.progressPct < 100 && t.state === "in_progress")
      );
    },
  },
];

const toneMap = {
  warm: { chip: "border-gold-200 bg-gold-50 text-gold-800", rail: "bg-gold-500" },
  info: { chip: "border-teal-200 bg-teal-50 text-teal-700", rail: "bg-teal-500" },
  accent: { chip: "border-teal-200 bg-teal-50 text-teal-700", rail: "bg-teal-500" },
  soft: { chip: "border-beige-200 bg-beige-50 text-beige-700", rail: "bg-beige-500" },
  muted: { chip: "border-beige-200 bg-beige-50 text-beige-700", rail: "bg-beige-400" },
} as const;

/**
 * Workload Priority Bar — 6 categorical buckets the contributor uses to
 * pivot the queue view. Same DSL as the mentor portal's triage bar but
 * tuned with friendlier tones: gold/teal/beige rather than red/red/red.
 */
export function PriorityBar({
  active,
  onToggle,
}: {
  active: WorkloadBucketKey | null;
  onToggle: (key: WorkloadBucketKey | null) => void;
}) {
  const tasks = useContributorTaskList();
  return (
    <div>
      <div className="flex items-end justify-between gap-3 mb-2">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-beige-700">
          Workload priorities
        </p>
        {active && (
          <button
            type="button"
            onClick={() => onToggle(null)}
            className="text-[11px] font-semibold text-beige-600 hover:text-brown-700"
          >
            Clear filter
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {workloadBuckets.map((b) => {
          const isActive = active === b.key;
          const count = tasks.filter(b.predicate).length;
          const tone = toneMap[b.tone];
          return (
            <button
              key={b.key}
              type="button"
              onClick={() => onToggle(isActive ? null : b.key)}
              className={cn(
                "relative text-left rounded-xl border bg-white px-4 py-3 pl-5 transition-colors",
                isActive
                  ? "border-teal-300 shadow-[0_2px_8px_rgba(91,155,162,0.12)]"
                  : "border-beige-200 hover:border-beige-300"
              )}
            >
              <span aria-hidden className={cn("absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full", tone.rail)} />
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-lg border",
                    count > 0 ? tone.chip : "border-beige-200 bg-beige-50 text-beige-500"
                  )}
                >
                  <b.Icon className="h-3.5 w-3.5" />
                </span>
                <span className="font-heading text-[20px] font-bold tabular-nums text-brown-950">{count}</span>
              </div>
              <p className="mt-2 text-[12px] font-semibold text-brown-950 leading-tight">{b.label}</p>
              <p className="mt-0.5 text-[10.5px] text-beige-600 leading-snug">{b.caption}</p>
              {isActive && (
                <span className="mt-2 inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-teal-700">
                  Filtering view
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
