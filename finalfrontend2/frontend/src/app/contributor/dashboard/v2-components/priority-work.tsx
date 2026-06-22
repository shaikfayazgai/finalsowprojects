"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Send,
  RotateCcw,
  Pause,
  Sparkles,
  ArrowRight,
  type LucideIcon,
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

type PriorityKind = "urgent" | "ready" | "revision" | "blocked" | "ai_suggest";

interface PriorityBucket {
  kind: PriorityKind;
  task: ContributorTask;
}

/**
 * Priority Work — the contributor's "what matters now" surface.
 *
 * Hand-picks 4-6 tasks across 5 priority types: approaching deadline,
 * ready to submit, revision required, blocked, AI-suggested. Card-forward,
 * one-glance scannable, calm.
 */
export function PriorityWork() {
  const router = useRouter();
  const contributorTasks = useContributorTaskList();

  const buckets: PriorityBucket[] = React.useMemo(() => {
    const out: PriorityBucket[] = [];

    const ready = contributorTasks.find((t) => t.state === "ready_for_submission");
    if (ready) out.push({ kind: "ready", task: ready });

    const urgent = contributorTasks
      .filter(
        (t) =>
          t.deadlineHoursRemaining > 0 &&
          t.deadlineHoursRemaining <= 24 &&
          t.state !== "approved" &&
          t.state !== "completed" &&
          t.state !== "under_review"
      )
      .sort((a, b) => a.deadlineHoursRemaining - b.deadlineHoursRemaining);
    urgent.slice(0, 2).forEach((t) => out.push({ kind: "urgent", task: t }));

    const revision = contributorTasks.find((t) => t.state === "revision_requested");
    if (revision) out.push({ kind: "revision", task: revision });

    const blocked = contributorTasks.find((t) => t.state === "blocked");
    if (blocked) out.push({ kind: "blocked", task: blocked });

    const suggestion = contributorTasks.find((t) => t.state === "assigned");
    if (suggestion) out.push({ kind: "ai_suggest", task: suggestion });

    return out.slice(0, 6);
  }, [contributorTasks]);

  return (
    <section>
      <ContributorSectionHeader
        title="Priority work"
        caption="What needs your attention now — and what you can take on next."
        trailing={
          <button
            type="button"
            onClick={() => router.push("/contributor/tasks")}
            className="text-[11.5px] font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1"
          >
            All tasks
            <ArrowRight className="h-3 w-3" />
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {buckets.map((b) => (
          <PriorityCard key={`${b.kind}-${b.task.id}`} bucket={b} />
        ))}
      </div>
    </section>
  );
}

const kindMeta: Record<
  PriorityKind,
  { label: string; chip: string; Icon: LucideIcon; cta: string }
> = {
  urgent: {
    label: "Due soon",
    chip: "border-gold-200 bg-gold-50 text-gold-800",
    Icon: Clock,
    cta: "Open workroom",
  },
  ready: {
    label: "Ready to submit",
    chip: "border-forest-200 bg-forest-50 text-forest-700",
    Icon: Send,
    cta: "Review and submit",
  },
  revision: {
    label: "Revision needed",
    chip: "border-gold-200 bg-gold-50 text-gold-800",
    Icon: RotateCcw,
    cta: "See what to fix",
  },
  blocked: {
    label: "Paused",
    chip: "border-beige-200 bg-beige-50 text-beige-800",
    Icon: Pause,
    cta: "View status",
  },
  ai_suggest: {
    label: "Suggested for you",
    chip: "border-teal-200 bg-teal-50 text-teal-700",
    Icon: Sparkles,
    cta: "Review task",
  },
};

function PriorityCard({ bucket }: { bucket: PriorityBucket }) {
  const meta = kindMeta[bucket.kind];
  const task = bucket.task;
  const router = useRouter();
  const isFeature = bucket.kind === "ready" || bucket.kind === "ai_suggest";

  return (
    <ContributorCard
      variant={isFeature ? "feature" : "default"}
      padded={false}
      className="p-4 md:p-5 flex flex-col"
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2 py-[1px] text-[10px] font-bold uppercase tracking-wider",
            meta.chip
          )}
        >
          <meta.Icon className="h-3 w-3" />
          {meta.label}
        </span>
        <PriorityChip priority={task.priority} />
      </div>

      <h3 className="font-heading text-[15px] font-semibold text-brown-950 mt-3 leading-tight">
        {task.title}
      </h3>
      <p className="text-[11.5px] text-beige-700 mt-0.5">
        {task.project} · {task.skill} {task.skillLevel}
      </p>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <DeadlinePill hoursRemaining={task.deadlineHoursRemaining} />
        <span className="text-[11px] font-semibold text-brown-900 tabular-nums">{task.payoutAmount}</span>
      </div>

      {bucket.kind !== "blocked" && bucket.kind !== "ai_suggest" && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-beige-700 mb-1">
            <span>Readiness</span>
            <span>{task.progressPct}% progress</span>
          </div>
          <ReadinessBar value={task.readinessScore} />
        </div>
      )}

      {bucket.kind === "revision" && task.mentorFeedback && (
        <div className="mt-3 rounded-lg border border-gold-200 bg-gold-50/40 px-2.5 py-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gold-800">
            {task.mentorFeedback.requiredCorrections?.length ?? 0} correction
            {(task.mentorFeedback.requiredCorrections?.length ?? 0) === 1 ? "" : "s"} from{" "}
            {task.mentorFeedback.mentorName}
          </p>
        </div>
      )}

      {bucket.kind === "blocked" && task.blockers?.[0] && (
        <div className="mt-3 rounded-lg border border-beige-200 bg-beige-50 px-2.5 py-1.5 text-[11px] text-beige-800">
          <p>
            <strong>Paused:</strong> {task.blockers[0].reason}
          </p>
          {task.blockers[0].expectedResolution && (
            <p className="text-beige-600 mt-0.5">Expected back {task.blockers[0].expectedResolution}</p>
          )}
        </div>
      )}

      {task.aiCue && (
        <div className="mt-3 flex items-start gap-2 text-[11.5px] text-brown-800">
          <AiGlyph className="mt-0.5 shrink-0" />
          <span className="leading-snug">{task.aiCue}</span>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-beige-200/70 flex items-center justify-between">
        <ContributorStateChip state={task.state} size="sm" />
        <button
          type="button"
          onClick={() =>
            router.push(
              bucket.kind === "revision"
                ? `/contributor/tasks/${task.id}/revision`
                : `/contributor/tasks/${task.id}`
            )
          }
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors",
            isFeature
              ? "bg-teal-600 text-white hover:bg-teal-700"
              : "border border-beige-200 bg-white text-brown-900 hover:border-beige-300 hover:bg-beige-50/40"
          )}
        >
          {meta.cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </ContributorCard>
  );
}
