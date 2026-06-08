"use client";

/**
 * Zone C · Work progress timeline
 *
 * Five-stage lifecycle visualization (not a table). Shows where the
 * contributor's work currently sits across the pipeline. Each stage
 * is a stage-card with count + a quick link to the filtered list.
 *
 *   Accepted  →  In Progress  →  Submitted  →  In Review  →  Accepted
 */

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  CircleDashed,
  CircleDot,
  FileCheck2,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useContributorTaskList } from "@/lib/contributor/use-contributor-tasks";
import type { ContributorTask } from "@/mocks/data/contributor-workspace";

interface Stage {
  key: string;
  label: string;
  caption: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  predicate: (t: ContributorTask) => boolean;
  href: string;
}

const STAGES: Stage[] = [
  {
    key: "accepted",
    label: "Accepted",
    caption: "Just claimed",
    icon: ListChecks,
    predicate: (t) => t.state === "assigned" || t.state === "accepted",
    href: "/contributor/tasks?state=accepted",
  },
  {
    key: "in_progress",
    label: "In progress",
    caption: "Actively working",
    icon: CircleDot,
    predicate: (t) =>
      t.state === "in_progress" ||
      t.state === "awaiting_clarification" ||
      t.state === "blocked",
    href: "/contributor/tasks?state=in_progress",
  },
  {
    key: "ready_submit",
    label: "Ready to submit",
    caption: "Final checks",
    icon: CircleDashed,
    predicate: (t) => t.state === "ready_for_submission",
    href: "/contributor/tasks?state=ready",
  },
  {
    key: "in_review",
    label: "In review",
    caption: "Mentor reviewing",
    icon: FileCheck2,
    predicate: (t) => t.state === "under_review",
    href: "/contributor/tasks/submissions",
  },
  {
    key: "accepted_done",
    label: "Accepted",
    caption: "Closed lifecycle",
    icon: CheckCircle2,
    predicate: (t) => t.state === "approved" || t.state === "completed",
    href: "/contributor/tasks/completed",
  },
];

export function LifecycleTimeline() {
  const tasks = useContributorTaskList();

  const counts = React.useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of STAGES) c[s.key] = tasks.filter(s.predicate).length;
    return c;
  }, [tasks]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const revisionCount = tasks.filter((t) => t.state === "revision_requested").length;

  return (
    <section aria-label="Work lifecycle" className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <h2 className="font-body text-[14px] font-semibold text-foreground tracking-tight">
            Where your work sits
          </h2>
          <p className="font-body text-[11.5px] text-text-tertiary mt-0.5 leading-snug">
            Pipeline across {total} task{total === 1 ? "" : "s"} you've touched recently.
          </p>
        </div>
      </div>

      {/* Stage row */}
      <div className="rounded-xl bg-surface ring-1 ring-stroke-subtle overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 divide-x-0 sm:divide-x divide-stroke-subtle">
          {STAGES.map((s, i) => (
            <StageCell
              key={s.key}
              stage={s}
              count={counts[s.key] || 0}
              isLast={i === STAGES.length - 1}
            />
          ))}
        </div>

        {revisionCount > 0 && (
          <div className="px-5 py-2.5 border-t border-stroke-subtle bg-warning-subtle/40 flex items-center justify-between gap-2">
            <p className="font-body text-[11.5px] text-warning-text">
              <strong className="font-semibold">
                {revisionCount} task{revisionCount === 1 ? "" : "s"}
              </strong>{" "}
              waiting on revision — addressing these unblocks downstream stages.
            </p>
            <Link
              href="/contributor/tasks/revisions"
              className="font-body text-[11px] font-semibold text-warning-text hover:underline whitespace-nowrap"
            >
              Open revisions →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function StageCell({
  stage,
  count,
}: {
  stage: Stage;
  count: number;
  isLast: boolean;
}) {
  const Icon = stage.icon;
  const isEmpty = count === 0;
  return (
    <Link
      href={stage.href}
      className={cn(
        "group px-4 py-4 flex flex-col gap-1.5 transition-colors duration-fast",
        "hover:bg-[var(--state-hover)]",
        isEmpty && "opacity-60",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          aria-hidden
          className={cn(
            "inline-flex items-center justify-center h-7 w-7 rounded-md",
            isEmpty
              ? "bg-bg-subtle text-text-tertiary"
              : "bg-[color-mix(in_oklab,var(--color-brand)_10%,transparent)] text-[var(--color-brand)]",
          )}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </span>
        <span className="font-body text-[22px] font-semibold text-foreground tabular-nums leading-none">
          {count}
        </span>
      </div>
      <div>
        <p className="font-body text-[12.5px] font-semibold text-foreground leading-tight">
          {stage.label}
        </p>
        <p className="font-body text-[10.5px] text-text-tertiary mt-0.5 leading-snug">
          {stage.caption}
        </p>
      </div>
    </Link>
  );
}
