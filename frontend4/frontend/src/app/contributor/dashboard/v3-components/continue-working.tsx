"use client";

/**
 * Zone B · Continue working — the focus area.
 *
 * Up to 3 cards. The first is the hero (largest, brand-tinted background,
 * primary CTA). Picks the single best task to resume right now:
 *   1) revision_requested  (highest urgency · operator commitment to mentor)
 *   2) ready_for_submission
 *   3) in_progress with highest progressPct
 *   4) accepted (fresh)
 *
 * The two supporting cards fill remaining open slots from the next-best
 * candidates. Card content stays minimal: state chip · title · project ·
 * readiness bar · next action.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowRight, FilePlus2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useContributorTaskList } from "@/lib/contributor/use-contributor-tasks";
import type { ContributorTask } from "@/mocks/data/contributor-workspace";

const STATE_CHIP: Record<string, { label: string; tone: string }> = {
  revision_requested: { label: "Revision", tone: "bg-warning-subtle text-warning-text" },
  ready_for_submission: { label: "Ready", tone: "bg-success-subtle text-success-text" },
  in_progress: { label: "In progress", tone: "bg-info-subtle text-info-text" },
  accepted: { label: "Accepted", tone: "bg-bg-subtle text-text-secondary" },
  assigned: { label: "Assigned", tone: "bg-bg-subtle text-text-secondary" },
  awaiting_clarification: { label: "Awaiting reply", tone: "bg-bg-subtle text-text-secondary" },
  under_review: { label: "In review", tone: "bg-info-subtle text-info-text" },
  blocked: { label: "Blocked", tone: "bg-error-subtle text-error-text" },
};

function scoreTask(t: ContributorTask): number {
  // Higher score = better candidate to surface
  if (t.state === "revision_requested") return 100;
  if (t.state === "ready_for_submission") return 80;
  if (t.state === "in_progress") return 50 + t.progressPct / 5;
  if (t.state === "accepted") return 30;
  if (t.state === "assigned") return 20;
  if (t.state === "awaiting_clarification") return 10;
  return 0;
}

export function ContinueWorking() {
  const tasks = useContributorTaskList();

  const candidates = React.useMemo(
    () =>
      [...tasks]
        .filter(
          (t) =>
            t.state !== "approved" &&
            t.state !== "completed" &&
            t.state !== "under_review",
        )
        .sort((a, b) => scoreTask(b) - scoreTask(a))
        .slice(0, 3),
    [tasks],
  );

  if (candidates.length === 0) {
    return <EmptyFocus />;
  }

  const [hero, ...rest] = candidates;

  return (
    <section aria-label="Continue working" className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-body text-[14px] font-semibold text-foreground tracking-tight">
          Continue working
        </h2>
        <Link
          href="/contributor/tasks"
          className="font-body text-[11.5px] font-semibold text-[var(--color-brand)] hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          All work
          <ArrowRight className="w-3 h-3" strokeWidth={2} aria-hidden />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <HeroCard task={hero} />
        {rest.map((t) => (
          <SupportCard key={t.id} task={t} />
        ))}
        {/* fill empty card slots with placeholders when fewer than 3 candidates */}
        {rest.length < 2 &&
          Array.from({ length: 2 - rest.length }).map((_, i) => (
            <BrowseMoreCard key={`fill-${i}`} />
          ))}
      </div>
    </section>
  );
}

/* ─── Hero card (left, spans 2 cols on lg) ─── */
function HeroCard({ task }: { task: ContributorTask }) {
  const chip = STATE_CHIP[task.state] ?? STATE_CHIP.assigned;
  const readiness = task.readinessScore ?? task.progressPct ?? 0;
  return (
    <Link
      href={`/contributor/tasks/${task.id}`}
      className={cn(
        "group lg:col-span-2 rounded-xl bg-surface ring-1 ring-stroke-subtle overflow-hidden",
        "hover:ring-stroke-strong transition-shadow duration-fast",
        "flex flex-col",
      )}
    >
      <div className="px-5 pt-5 pb-4 flex-1">
        <div className="flex items-center gap-2 mb-3">
          <span
            className={cn(
              "inline-flex items-center justify-center h-[18px] px-1.5 rounded font-body text-[10px] font-bold uppercase tracking-wide leading-none",
              chip.tone,
            )}
          >
            {chip.label}
          </span>
          <span className="font-body text-[11px] text-text-tertiary">
            {task.project}
          </span>
        </div>
        <h3 className="font-body text-[17px] font-semibold text-foreground leading-tight tracking-tight">
          {task.title}
        </h3>
        <p className="mt-1.5 font-body text-[12.5px] text-text-secondary leading-relaxed line-clamp-2">
          {task.description}
        </p>

        {/* Readiness bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-body text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-tertiary">
              {task.state === "in_progress" ? "Progress" : "Readiness"}
            </span>
            <span className="font-body text-[11px] font-semibold text-foreground tabular-nums">
              {readiness}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-bg-subtle overflow-hidden">
            <div
              className="h-full bg-[var(--color-brand)] transition-all duration-base"
              style={{ width: `${readiness}%` }}
            />
          </div>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-stroke-subtle flex items-center justify-between gap-2">
        <span className="font-body text-[11.5px] text-text-tertiary">
          {task.deadlineHoursRemaining > 0
            ? `${formatHours(task.deadlineHoursRemaining)} until deadline`
            : `${formatHours(-task.deadlineHoursRemaining)} past deadline`}
        </span>
        <span className="inline-flex items-center gap-1 font-body text-[12.5px] font-semibold text-[var(--color-brand)] group-hover:gap-1.5 transition-all">
          {task.nextAction}
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} aria-hidden />
        </span>
      </div>
    </Link>
  );
}

/* ─── Supporting card (right) ─── */
function SupportCard({ task }: { task: ContributorTask }) {
  const chip = STATE_CHIP[task.state] ?? STATE_CHIP.assigned;
  return (
    <Link
      href={`/contributor/tasks/${task.id}`}
      className="group rounded-xl bg-surface ring-1 ring-stroke-subtle px-4 py-4 hover:ring-stroke-strong transition-shadow duration-fast flex flex-col"
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={cn(
            "inline-flex items-center justify-center h-[18px] px-1.5 rounded font-body text-[10px] font-bold uppercase tracking-wide leading-none",
            chip.tone,
          )}
        >
          {chip.label}
        </span>
        <span className="font-body text-[10.5px] text-text-tertiary truncate">
          {task.project}
        </span>
      </div>
      <h3 className="font-body text-[13.5px] font-semibold text-foreground leading-snug line-clamp-2">
        {task.title}
      </h3>
      <p className="mt-auto pt-3 inline-flex items-center gap-1 font-body text-[11.5px] font-semibold text-[var(--color-brand)]">
        {task.nextAction}
        <ArrowRight
          className="w-3 h-3 transition-transform group-hover:translate-x-0.5"
          strokeWidth={2}
          aria-hidden
        />
      </p>
    </Link>
  );
}

/* ─── Fill slot when fewer than 3 candidates ─── */
function BrowseMoreCard() {
  return (
    <Link
      href="/contributor/tasks"
      className="group rounded-xl bg-bg-subtle/40 ring-1 ring-dashed ring-stroke-subtle px-4 py-4 hover:bg-bg-subtle transition-colors flex flex-col items-start justify-between min-h-[140px]"
    >
      <div className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-surface ring-1 ring-stroke-subtle text-text-tertiary">
        <FilePlus2 className="w-4 h-4" strokeWidth={2} aria-hidden />
      </div>
      <div>
        <p className="font-body text-[13px] font-semibold text-foreground leading-tight">
          Pick up new work
        </p>
        <p className="mt-1 font-body text-[11.5px] text-text-tertiary leading-snug">
          Browse tasks matching your skill profile.
        </p>
      </div>
    </Link>
  );
}

/* ─── Empty state ─── */
function EmptyFocus() {
  return (
    <section
      aria-label="Continue working"
      className="rounded-xl bg-surface ring-1 ring-stroke-subtle px-6 py-10 text-center"
    >
      <p className="font-body text-[14px] font-semibold text-foreground">
        All caught up
      </p>
      <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-md mx-auto leading-relaxed">
        You have no active work right now. When you're ready, browse open tasks
        matched to your skill profile.
      </p>
      <Link
        href="/contributor/tasks"
        className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-[var(--color-brand)] text-text-inverse font-body text-[12.5px] font-semibold hover:opacity-95"
      >
        Browse open tasks
        <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} aria-hidden />
      </Link>
    </section>
  );
}

function formatHours(h: number): string {
  if (h < 1) return "< 1h";
  if (h < 24) return `${Math.round(h)}h`;
  const d = Math.round(h / 24);
  return `${d}d`;
}
