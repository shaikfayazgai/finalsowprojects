"use client";

/**
 * Context rail V3 — right column, sticky.
 *
 *   1. Progress timeline       lifecycle visualization
 *   2. Mentor (compact)         reviewer identity + ask button
 *   3. AI signals               up to 3 quiet pattern observations
 *   4. References                external links the contributor needs
 */

import * as React from "react";
import {
  CheckCircle2,
  Circle,
  CircleDot,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAgent } from "@/lib/hooks/use-agent";
import type {
  ContributorSupportInput,
  ContributorSupportOutput,
} from "@/lib/ai";
import type { WorkroomTask } from "@/mocks/data/contributor-workroom-detail";

interface ContextRailProps {
  task: WorkroomTask;
}

export function ContextRail({ task }: ContextRailProps) {
  return (
    <aside aria-label="Workroom context" className="space-y-4">
      <ProgressTimeline task={task} />
      <MentorCard task={task} />
      <AiSignalsCard task={task} />
      {task.externalLinks.length > 0 && <ReferencesCard task={task} />}
    </aside>
  );
}

/* ───────── Progress timeline ───────── */

const STAGE_ORDER = [
  "accepted",
  "in_progress",
  "submitted",
  "in_review",
  "revision_requested",
  "approved",
] as const;

const STAGE_LABEL: Record<string, string> = {
  accepted: "Accepted",
  in_progress: "In progress",
  submitted: "Submitted",
  in_review: "In review",
  revision_requested: "Revision",
  approved: "Accepted",
};

function ProgressTimeline({ task }: { task: WorkroomTask }) {
  // Map task state to a position in the lifecycle.
  const positions = {
    assigned: 0,
    accepted: 0,
    in_progress: 1,
    awaiting_clarification: 1,
    blocked: 1,
    ready_for_submission: 1,
    under_review: 3,
    revision_requested: 4,
    approved: 5,
    completed: 5,
  } as const;
  const current = (positions[task.state as keyof typeof positions] ?? 1) as number;

  // For a clean visual, condense to a 5-stage track that hides "revision" when
  // there's no revision round, and inlines it when there is one.
  const showRevision = task.reworkRound != null && task.reworkRound > 0;
  const stages = showRevision
    ? ["accepted", "in_progress", "submitted", "in_review", "revision_requested", "approved"]
    : ["accepted", "in_progress", "submitted", "in_review", "approved"];
  const indexOf = (s: string) => STAGE_ORDER.indexOf(s as (typeof STAGE_ORDER)[number]);

  return (
    <section className="rounded-xl bg-surface ring-1 ring-stroke-subtle overflow-hidden">
      <header className="px-4 py-3 border-b border-stroke-subtle">
        <h3 className="font-body text-[12.5px] font-semibold text-foreground leading-tight">
          Progress
        </h3>
        <p className="mt-0.5 font-body text-[11px] text-text-tertiary leading-snug">
          Where this task sits in the lifecycle
        </p>
      </header>
      <ol className="px-4 py-3 space-y-2">
        {stages.map((stageKey) => {
          const idx = indexOf(stageKey);
          const isDone = idx < current;
          const isCurrent = idx === current;
          return (
            <li key={stageKey} className="flex items-center gap-2.5">
              <span
                aria-hidden
                className={cn(
                  "inline-flex items-center justify-center h-5 w-5 rounded-full shrink-0",
                  isDone
                    ? "bg-success-subtle text-success-text"
                    : isCurrent
                      ? "bg-[color-mix(in_oklab,var(--color-brand)_15%,transparent)] text-[var(--color-brand)] ring-2 ring-[var(--color-brand)]"
                      : "ring-1 ring-stroke-strong text-text-tertiary",
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="h-3 w-3" strokeWidth={2} aria-hidden />
                ) : isCurrent ? (
                  <CircleDot className="h-2.5 w-2.5" strokeWidth={2} aria-hidden />
                ) : (
                  <Circle className="h-2 w-2" strokeWidth={2} aria-hidden />
                )}
              </span>
              <span
                className={cn(
                  "font-body text-[12px] leading-tight",
                  isCurrent
                    ? "font-semibold text-foreground"
                    : isDone
                      ? "text-text-secondary"
                      : "text-text-tertiary",
                )}
              >
                {STAGE_LABEL[stageKey]}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ───────── Mentor card ───────── */

function MentorCard({ task }: { task: WorkroomTask }) {
  if (!task.mentor) return null;
  const m = task.mentor;
  return (
    <section className="rounded-xl bg-surface ring-1 ring-stroke-subtle overflow-hidden">
      <header className="px-4 py-3 border-b border-stroke-subtle">
        <h3 className="font-body text-[12.5px] font-semibold text-foreground leading-tight">
          Reviewer
        </h3>
      </header>
      <div className="px-4 py-3 flex items-center gap-3">
        <span
          aria-hidden
          className="shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-full bg-[var(--color-brand)] text-text-inverse font-body text-[12px] font-semibold leading-none"
        >
          {m.initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-body text-[12.5px] font-semibold text-foreground leading-tight truncate">
            {m.name}
          </p>
          <p className="font-body text-[11px] text-text-tertiary leading-snug truncate">
            {m.role}
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-md text-text-tertiary hover:text-foreground hover:bg-[var(--state-hover)] transition-colors"
          aria-label="Ask reviewer for clarification"
        >
          <MessageSquare className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </button>
      </div>
    </section>
  );
}

/* ───────── AI signals ───────── */

/**
 * Workroom AI signals — routed through the real contributor-support
 * agent via `POST /api/ai/invoke`. The orchestrator persists every
 * call to AgentInvocation and emits `agent.invoke` + `agent.respond`
 * audit events. Phase 1 uses rule-based mock output server-side;
 * Phase 2 swaps to LLM with the same surface.
 *
 * Graceful degrade (locked decision #7): if the agent fails or hasn't
 * responded yet, the card hides — never blocks the workroom.
 */

function AiSignalsCard({ task }: { task: WorkroomTask }) {
  const criteria = task.acceptanceCriteria ?? [];
  const artifacts = task.evidence?.artifacts ?? [];
  const addressed = criteria.filter((c) => c.addressed).length;

  // Stable per task+state. Re-fetches only when meaningful inputs change.
  const requestId = `task-${task.id}-criteria-${addressed}-of-${criteria.length}-artifacts-${artifacts.length}-state-${task.state}`;

  const { data } = useAgent<ContributorSupportInput, ContributorSupportOutput>({
    agentId: "contributor-support",
    promptName: "signals",
    variables: {
      taskState: task.state,
      criteria: criteria.map((c) => ({
        id: c.id,
        label: c.label,
        addressed: c.addressed,
      })),
      evidence: artifacts.map((a) => ({
        name: a.name,
        size: 0,
      })),
    },
    requestId,
    enabled: Boolean(task.id),
  });

  // Hide until first successful response. Per "summoned, not pushed."
  if (!data || !data.ok) return null;

  const signals = data.response.output.signals ?? [];
  if (signals.length === 0) return null;

  const confidence = data.response.confidence;
  const confidenceLabel =
    confidence >= 0.85 ? "high" : confidence >= 0.65 ? "medium" : "low";

  return (
    <section className="rounded-xl bg-[var(--color-ai-surface)]/40 ring-1 ring-stroke-subtle overflow-hidden">
      <header className="px-4 py-3 border-b border-stroke-subtle flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-flex items-center justify-center h-5 w-5 rounded bg-[var(--color-ai-surface)] text-[var(--color-ai-text)]"
          >
            <Sparkles className="h-3 w-3" strokeWidth={2} aria-hidden />
          </span>
          <h3 className="font-body text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-ai-text)]">
            AI signals
          </h3>
        </div>
        <span
          className={cn(
            "font-body text-[9.5px] font-semibold uppercase tracking-wide",
            "px-1.5 h-[16px] inline-flex items-center rounded leading-none",
            "bg-[var(--color-ai-surface)] text-[var(--color-ai-text)]",
          )}
          title={`Agent confidence: ${(confidence * 100).toFixed(0)}%`}
        >
          {confidenceLabel}
        </span>
      </header>
      <ul className="divide-y divide-stroke-subtle">
        {signals.slice(0, 3).map((s, i) => (
          <li
            key={i}
            className="px-4 py-2.5 font-body text-[12px] text-foreground leading-snug"
          >
            <span aria-hidden className="text-[var(--color-ai-text)] mr-1.5">
              ›
            </span>
            {s}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ───────── References ───────── */

function ReferencesCard({ task }: { task: WorkroomTask }) {
  return (
    <section className="rounded-xl bg-surface ring-1 ring-stroke-subtle overflow-hidden">
      <header className="px-4 py-3 border-b border-stroke-subtle">
        <h3 className="font-body text-[12.5px] font-semibold text-foreground leading-tight">
          References
        </h3>
      </header>
      <ul className="divide-y divide-stroke-subtle">
        {task.externalLinks.map((l) => (
          <li key={l.label}>
            <a
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-2 px-4 py-2.5 hover:bg-[var(--state-hover)] transition-colors"
            >
              <ExternalLink
                className="h-3.5 w-3.5 text-text-tertiary group-hover:text-foreground transition-colors shrink-0"
                strokeWidth={2}
                aria-hidden
              />
              <span className="min-w-0 flex-1 font-body text-[12px] text-foreground truncate">
                {l.label}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
