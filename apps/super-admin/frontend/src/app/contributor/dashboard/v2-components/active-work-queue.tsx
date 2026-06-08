"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorCard,
  ContributorSectionHeader,
  ContributorStateChip,
  DeadlinePill,
  ReadinessBar,
  AiGlyph,
} from "@/app/contributor/_shared/primitives";
import type { ContributorTask } from "@/mocks/data/contributor-workspace";
import { useContributorTaskList } from "@/lib/contributor/use-contributor-tasks";

type FilterKey = "all" | "in_progress" | "needs_action" | "submitted" | "completed";

const filters: { key: FilterKey; label: string; predicate: (t: ContributorTask) => boolean }[] = [
  { key: "all", label: "All work", predicate: () => true },
  {
    key: "in_progress",
    label: "In progress",
    predicate: (t) =>
      ["accepted", "in_progress", "awaiting_clarification", "ready_for_submission"].includes(t.state),
  },
  {
    key: "needs_action",
    label: "Needs action",
    predicate: (t) => t.state === "revision_requested" || t.state === "awaiting_clarification",
  },
  {
    key: "submitted",
    label: "Submitted",
    predicate: (t) => t.state === "under_review",
  },
  {
    key: "completed",
    label: "Completed",
    predicate: (t) => t.state === "approved" || t.state === "completed",
  },
];

/**
 * Active Work Queue — card-forward operational queue (not a dense table).
 *
 * Each task is a complete card with state, deadline, progress, payout, and
 * the single next action visible. Filters at the top let the contributor
 * pivot views without leaving the screen.
 */
export function ActiveWorkQueue() {
  const contributorTasks = useContributorTaskList();
  const router = useRouter();
  const [filter, setFilter] = React.useState<FilterKey>("in_progress");
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const rows = React.useMemo(() => {
    const f = filters.find((x) => x.key === filter)!;
    return contributorTasks.filter(f.predicate);
  }, [filter]);

  return (
    <section>
      <ContributorSectionHeader
        title="Your work queue"
        caption="Pick up where you left off — each task carries the next action you need."
        trailing={
          <button
            type="button"
            onClick={() => router.push("/contributor/tasks")}
            className="text-[11.5px] font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1"
          >
            All work
            <ArrowRight className="h-3 w-3" />
          </button>
        }
      />

      <ContributorCard padded={false} className="overflow-hidden">
        {/* Filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto px-4 md:px-5 pt-4 pb-3 border-b border-beige-200/70">
          {filters.map((f) => {
            const count = contributorTasks.filter(f.predicate).length;
            const active = f.key === filter;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap transition-colors",
                  active
                    ? "border-teal-300 bg-teal-50 text-teal-800"
                    : "border-beige-200 bg-white text-beige-700 hover:border-beige-300"
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "tabular-nums",
                    active ? "text-teal-700" : "text-beige-500"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Cards */}
        <ul className="divide-y divide-beige-200/60">
          {rows.length === 0 && (
            <li className="px-5 py-10 text-center text-[12.5px] text-beige-700">
              You&rsquo;re all caught up — nothing in this view.
            </li>
          )}
          {rows.map((task) => (
            <li key={task.id}>
              <QueueRow
                task={task}
                expanded={expanded === task.id}
                onExpand={() => setExpanded(expanded === task.id ? null : task.id)}
                onOpen={() => router.push(`/contributor/tasks/${task.id}`)}
              />
            </li>
          ))}
        </ul>
      </ContributorCard>
    </section>
  );
}

function QueueRow({
  task,
  expanded,
  onExpand,
  onOpen,
}: {
  task: ContributorTask;
  expanded: boolean;
  onExpand: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="px-4 md:px-5 py-3.5 hover:bg-beige-50/40 transition-colors">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_140px_120px_120px_40px] gap-4 items-center">
        {/* Title + meta */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[13.5px] font-semibold text-brown-950 truncate">{task.title}</p>
            <ContributorStateChip state={task.state} size="sm" />
            {task.reworkRound && (
              <span className="inline-flex items-center rounded-full border border-gold-200 bg-gold-50 px-2 py-[1px] text-[10px] font-semibold text-gold-800">
                Round {task.reworkRound}/{task.totalRounds}
              </span>
            )}
          </div>
          <p className="mt-1 text-[11.5px] text-beige-700 truncate">
            {task.project} · {task.skill} {task.skillLevel} · last activity {task.lastActivityAt}
          </p>
        </div>

        {/* Deadline */}
        <div className="text-[11px]">
          <DeadlinePill hoursRemaining={task.deadlineHoursRemaining} />
        </div>

        {/* Progress */}
        <div className="text-[11px]">
          <ReadinessBar value={task.progressPct} size="sm" />
        </div>

        {/* Payout */}
        <div className="text-[12.5px] font-semibold text-brown-900 tabular-nums">{task.payoutAmount}</div>

        {/* Next action */}
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-[11.5px] font-semibold text-teal-800 hover:bg-teal-100"
        >
          {task.nextAction}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={onExpand}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-beige-500 hover:text-brown-700"
          aria-label="Toggle details"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-beige-200/60 grid grid-cols-1 md:grid-cols-3 gap-3 text-[11.5px]">
          <div className="rounded-lg border border-beige-200 bg-beige-50/40 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-beige-700">
              Acceptance criteria
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {task.acceptanceCriteria.slice(0, 4).map((c) => (
                <li key={c.id} className="flex items-start gap-1.5">
                  <CheckCircle2
                    className={cn(
                      "h-3 w-3 mt-0.5 shrink-0",
                      c.addressed ? "text-forest-600" : "text-beige-400"
                    )}
                  />
                  <span className={cn(c.addressed ? "text-beige-700 line-through" : "text-brown-900")}>
                    {c.label}
                  </span>
                </li>
              ))}
              {task.acceptanceCriteria.length > 4 && (
                <li className="text-[10.5px] text-beige-600 italic">
                  + {task.acceptanceCriteria.length - 4} more
                </li>
              )}
            </ul>
          </div>
          <div className="rounded-lg border border-beige-200 bg-beige-50/40 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-beige-700">Readiness</p>
            <ReadinessBar value={task.readinessScore} />
            <p className="text-[10.5px] text-beige-700 mt-1.5">
              Estimated {Math.round(task.estimatedMinutesRemaining / 60 * 10) / 10}h of focused work
              remaining
            </p>
          </div>
          <div className="rounded-lg border border-teal-200 bg-teal-50/30 p-3">
            <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-700">
              <AiGlyph />
              Suggestion
            </p>
            {task.aiCue && <p className="mt-1 text-brown-900 leading-snug">{task.aiCue}</p>}
            {task.aiNextAction && (
              <p className="mt-1 text-teal-800 font-semibold leading-snug">→ {task.aiNextAction}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

