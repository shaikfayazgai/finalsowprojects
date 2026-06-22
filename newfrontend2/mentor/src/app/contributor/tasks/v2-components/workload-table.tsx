"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Bookmark,
  BookmarkPlus,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorCard,
  ContributorSectionHeader,
  ContributorStateChip,
  DeadlinePill,
  PriorityChip,
  ReadinessBar,
  AiGlyph,
} from "@/app/contributor/_shared/primitives";
import type { ContributorTask } from "@/mocks/data/contributor-workspace";
import { useContributorTaskList } from "@/lib/contributor/use-contributor-tasks";
import {
  workloadBuckets,
  type WorkloadBucketKey,
} from "./priority-bar";

type SavedViewKey = "mine_active" | "ready_to_submit" | "due_today" | "needs_action" | "submitted";

interface SavedView {
  key: SavedViewKey;
  label: string;
  description: string;
  predicate: (t: ContributorTask) => boolean;
}

const savedViews: SavedView[] = [
  {
    key: "mine_active",
    label: "My active work",
    description: "Anything in progress or about to be",
    predicate: (t) =>
      ["accepted", "in_progress", "awaiting_clarification", "ready_for_submission"].includes(t.state),
  },
  {
    key: "ready_to_submit",
    label: "Ready to submit",
    description: "Submission readiness ≥ 80%",
    predicate: (t) => t.state === "ready_for_submission" || t.readinessScore >= 80,
  },
  {
    key: "due_today",
    label: "Due today",
    description: "Within the next 24 hours",
    predicate: (t) => t.deadlineHoursRemaining > 0 && t.deadlineHoursRemaining <= 24,
  },
  {
    key: "needs_action",
    label: "Needs my attention",
    description: "Revisions or paused clarifications",
    predicate: (t) => t.state === "revision_requested" || t.state === "awaiting_clarification",
  },
  {
    key: "submitted",
    label: "Submitted",
    description: "Under mentor review",
    predicate: (t) => t.state === "under_review",
  },
];

type SortKey = "deadline" | "readiness" | "priority" | "state";

interface WorkloadTableProps {
  bucket: WorkloadBucketKey | null;
  selectedId: string | null;
  onSelectRow: (task: ContributorTask) => void;
}

/**
 * Workload Table — card-row hybrid for the contributor's "My Work" surface.
 *
 * Card-forward per row, comfortable padding, click-to-expand for details,
 * single primary action per row. Different from the mentor portal's
 * tight-density tables: bigger type, calmer accents, friendly state words.
 */
export function WorkloadTable({ bucket, selectedId, onSelectRow }: WorkloadTableProps) {
  const router = useRouter();
  const allTasks = useContributorTaskList();
  const [query, setQuery] = React.useState("");
  const [savedView, setSavedView] = React.useState<SavedViewKey | null>(null);
  const [sort, setSort] = React.useState<SortKey>("deadline");
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const rows = React.useMemo(() => {
    // Default view excludes completed/approved — those live in /tasks/completed.
    // A bucket or saved view filter (below) can override this implicit scope.
    let out = allTasks.filter(
      (t) => t.state !== "completed" && t.state !== "approved",
    );

    if (bucket) {
      const b = workloadBuckets.find((x) => x.key === bucket);
      if (b) out = out.filter(b.predicate);
    }

    if (savedView) {
      const v = savedViews.find((x) => x.key === savedView);
      if (v) out = out.filter(v.predicate);
    }

    if (query) {
      const q = query.toLowerCase();
      out = out.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.project.toLowerCase().includes(q) ||
          t.skill.toLowerCase().includes(q)
      );
    }

    return [...out].sort((a, b) => {
      switch (sort) {
        case "deadline":
          return a.deadlineHoursRemaining - b.deadlineHoursRemaining;
        case "readiness":
          return b.readinessScore - a.readinessScore;
        case "priority":
          return a.priority.localeCompare(b.priority);
        case "state":
          return a.state.localeCompare(b.state);
      }
    });
  }, [allTasks, bucket, savedView, query, sort]);

  return (
    <ContributorCard padded={false} className="overflow-hidden">
      {/* Header + filters */}
      <div className="px-5 pt-5 pb-3 border-b border-beige-200">
        <ContributorSectionHeader
          title="My work"
          caption={`${rows.length} of ${allTasks.length} tasks · sorted by ${
            sort === "deadline" ? "deadline" : sort === "readiness" ? "readiness" : sort
          }`}
        />

        {/* Saved views */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
          {savedViews.map((v) => {
            const count = allTasks.filter(v.predicate).length;
            const active = v.key === savedView;
            return (
              <button
                key={v.key}
                type="button"
                onClick={() => setSavedView(active ? null : v.key)}
                title={v.description}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11.5px] font-semibold whitespace-nowrap transition-colors",
                  active
                    ? "border-teal-300 bg-teal-50 text-teal-800"
                    : "border-beige-200 bg-white text-beige-700 hover:border-beige-300"
                )}
              >
                {active ? <Bookmark className="h-3 w-3" /> : <BookmarkPlus className="h-3 w-3 text-beige-500" />}
                {v.label}
                <span className={cn("tabular-nums", active ? "text-teal-700" : "text-beige-500")}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Sort + search */}
        <div className="flex items-center gap-2 mt-2">
          <div className="inline-flex items-center gap-1.5">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-beige-700">Sort</p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-8 rounded-md border border-beige-200 bg-white px-2 text-[11.5px] font-medium text-brown-900 outline-none focus:border-teal-300"
            >
              <option value="deadline">By deadline</option>
              <option value="readiness">By readiness</option>
              <option value="priority">By priority</option>
              <option value="state">By state</option>
            </select>
          </div>
          <div className="relative ml-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-beige-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search task, project, skill…"
              className="h-8 w-64 rounded-md border border-beige-200 bg-white pl-8 pr-3 text-[12px] text-brown-900 placeholder:text-beige-500 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
            />
          </div>
        </div>
      </div>

      {/* Rows */}
      <ul className="divide-y divide-beige-200/70">
        {rows.length === 0 && (
          <li className="px-5 py-12 text-center text-[13px] text-beige-700">
            <p className="text-brown-950 font-semibold">You&rsquo;re all caught up</p>
            <p className="mt-1">Nothing in this view right now.</p>
          </li>
        )}
        {rows.map((task) => (
          <li key={task.id}>
            <WorkloadRow
              task={task}
              isSelected={selectedId === task.id}
              isExpanded={expanded === task.id}
              onSelect={() => onSelectRow(task)}
              onExpand={() => setExpanded(expanded === task.id ? null : task.id)}
              onOpen={() =>
                router.push(
                  task.state === "revision_requested"
                    ? `/contributor/tasks/${task.id}/revision`
                    : `/contributor/tasks/${task.id}`,
                )
              }
            />
          </li>
        ))}
      </ul>
    </ContributorCard>
  );
}

function WorkloadRow({
  task,
  isSelected,
  isExpanded,
  onSelect,
  onExpand,
  onOpen,
}: {
  task: ContributorTask;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onExpand: () => void;
  onOpen: () => void;
}) {
  return (
    <div
      className={cn(
        "transition-colors",
        isSelected && "bg-teal-50/30 ring-1 ring-inset ring-teal-200/60"
      )}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
        className="w-full text-left px-5 py-4 hover:bg-beige-50/40 transition-colors cursor-pointer"
      >
        <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_160px_120px] gap-4 items-center">
          {/* Title + state */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[13.5px] font-semibold text-brown-950 truncate">{task.title}</p>
              <ContributorStateChip state={task.state} size="sm" />
              {task.reworkRound && (
                <span className="inline-flex items-center rounded-full border border-gold-200 bg-gold-50 px-2 py-[1px] text-[10px] font-semibold text-gold-800">
                  Round {task.reworkRound}/{task.totalRounds}
                </span>
              )}
              <PriorityChip priority={task.priority} />
            </div>
            <p className="mt-1 text-[11.5px] text-beige-700 truncate">
              {task.project} · {task.skill} {task.skillLevel} · last activity {task.lastActivityAt}
            </p>
          </div>

          {/* Deadline */}
          <div>
            <DeadlinePill hoursRemaining={task.deadlineHoursRemaining} />
            <p className="mt-1 text-[10.5px] text-beige-600 tabular-nums">
              {task.payoutAmount}
            </p>
          </div>

          {/* Readiness */}
          <div>
            <ReadinessBar value={task.readinessScore} size="sm" />
            <p className="mt-1 text-[10.5px] text-beige-600">
              {task.progressPct}% progress
            </p>
          </div>

          {/* Next action */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpen();
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-[11.5px] font-semibold text-teal-800 hover:bg-teal-100"
            >
              {task.nextAction}
              <ArrowRight className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onExpand();
              }}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-beige-500 hover:text-brown-700"
              aria-label="Toggle details"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Inline blocker / awaiting hint */}
        {(task.state === "blocked" || task.state === "awaiting_clarification") && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-beige-200 bg-beige-50 px-3 py-1.5 text-[11.5px] text-beige-800">
            <AlertCircle className="h-3.5 w-3.5 text-beige-600 shrink-0" />
            {task.state === "blocked"
              ? task.blockers?.[0]?.reason ?? "Paused — we'll let you know when this is ready"
              : "Waiting on a reply from your mentor"}
          </div>
        )}

        {/* AI cue */}
        {task.aiCue && !task.blockers?.length && (
          <div className="mt-2 flex items-start gap-2 text-[11px] text-beige-700">
            <AiGlyph className="mt-0.5 shrink-0" />
            <span className="leading-snug">{task.aiCue}</span>
          </div>
        )}
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="px-5 pb-4 -mt-1 grid grid-cols-1 md:grid-cols-3 gap-3 text-[11.5px]">
          <div className="rounded-lg border border-beige-200 bg-beige-50/40 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-beige-700">
              Acceptance criteria
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {task.acceptanceCriteria.slice(0, 4).map((c) => (
                <li key={c.id} className="flex items-start gap-1.5">
                  {c.addressed ? (
                    <CheckCircle2 className="h-3 w-3 mt-0.5 text-forest-600 shrink-0" />
                  ) : (
                    <Circle className="h-3 w-3 mt-0.5 text-beige-400 shrink-0" />
                  )}
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
              ~{Math.round(task.estimatedMinutesRemaining / 60 * 10) / 10}h of focused work remaining
            </p>
          </div>
          <div className="rounded-lg border border-teal-200 bg-teal-50/30 p-3">
            <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-700">
              <AiGlyph />
              Helper
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
