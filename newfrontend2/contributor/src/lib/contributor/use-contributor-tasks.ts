/**
 * Live-store-backed contributor task list, projected to the legacy
 * `ContributorTask` shape so existing queue/dashboard components can
 * keep their props but read reactive store data.
 *
 * Use this hook in any component that currently imports `contributorTasks`
 * from `@/mocks/data/contributor-workspace`. The hook returns the store's
 * tasks, transformed into the same shape.
 *
 * Derived fields like `aiCue` and `nextAction` are computed live from
 * task state (not the stale static strings from the mock).
 */

"use client";

import * as React from "react";
import {
  useContributorTasksStore,
  type Task,
} from "@/lib/stores/contributor-tasks-store";
import type { ContributorTask } from "@/mocks/data/contributor-workspace";

export function useContributorTaskList(): ContributorTask[] {
  // Subscribe to the stable map reference; project to ContributorTask
  // shape via useMemo so the returned array is referentially stable
  // across renders unless tasksById actually changes.
  const tasksById = useContributorTasksStore((s) => s.tasksById);
  return React.useMemo(
    () => Object.values(tasksById).map(toLegacyShape),
    [tasksById],
  );
}

export function useContributorTask(id: string): ContributorTask | undefined {
  const task = useContributorTasksStore((s) => s.tasksById[id]);
  return React.useMemo(() => (task ? toLegacyShape(task) : undefined), [task]);
}

function toLegacyShape(t: Task): ContributorTask {
  const evidenceCompleteness = computeEvidenceCompleteness(t);
  return {
    id: t.id,
    title: t.title,
    description: t.shortDescription,
    project: t.project,
    portfolio: t.portfolio,
    priority: t.priority,
    skill: t.skill,
    skillLevel: t.skillLevel,
    deadline: t.deadline,
    deadlineHoursRemaining: t.deadlineHoursRemaining,
    state: t.state,
    progressPct: t.progressPct,
    estimatedMinutesRemaining: t.estimatedMinutesRemaining,
    payoutAmount: t.payoutAmount,
    acceptanceCriteria: t.acceptanceCriteria,
    evidenceCompleteness,
    readinessScore: t.readinessScore,
    blockers: undefined,
    mentorFeedback: t.mentorFeedback,
    reworkRound: t.reworkRound,
    totalRounds: t.totalRounds,
    aiCue: deriveAiCue(t),
    aiNextAction: deriveAiNextAction(t),
    lastActivityAt: t.lastActivityAt,
    reviewWindowHours: 24,
    nextAction: deriveNextAction(t),
  };
}

function computeEvidenceCompleteness(t: Task): number {
  if (t.state === "completed" || t.state === "approved") return 100;
  const required = t.deliverables?.filter((d) => d.required).length ?? 0;
  if (required === 0) return Math.round(t.readinessScore);
  return Math.min(100, Math.round((t.evidence.length / required) * 100));
}

function deriveAiCue(t: Task): string | undefined {
  if (t.state === "revision_requested") {
    const corrections = t.mentorFeedback?.requiredCorrections ?? [];
    const unresolved = corrections.filter(
      (c) => !t.resolvedCorrections.includes(c.id),
    ).length;
    if (unresolved === 0) return "All corrections addressed · ready to resubmit";
    return `${unresolved} ${unresolved === 1 ? "correction" : "corrections"} to address · open revision flow`;
  }
  if (t.state === "ready_for_submission") {
    return "Readiness looks good · send when you're confident";
  }
  if (t.state === "under_review") {
    return "Mentor reviewing · no action needed";
  }
  if (t.state === "blocked") {
    return "Blocked · clear the dependency to resume";
  }
  if (t.state === "awaiting_clarification") {
    return "SLA paused · awaiting mentor reply";
  }
  if (t.state === "in_progress" && t.readinessScore >= 70) {
    return `Roughly ${Math.max(15, t.estimatedMinutesRemaining)} minutes to ready`;
  }
  if (t.state === "in_progress") {
    return "Working through the spec · keep going";
  }
  if (t.state === "completed" || t.state === "approved") {
    return "Accepted · filed in completed work";
  }
  if (t.state === "assigned") {
    return "Open the workroom to accept and start";
  }
  return undefined;
}

function deriveAiNextAction(t: Task): string | undefined {
  if (t.state === "revision_requested") {
    const next = t.mentorFeedback?.requiredCorrections?.find(
      (c) => !t.resolvedCorrections.includes(c.id),
    );
    return next ? `Address "${next.criterion}"` : "Resubmit for review";
  }
  if (t.state === "ready_for_submission") return "Open the submission flow";
  if (t.state === "in_progress") return "Continue working in the workroom";
  if (t.state === "blocked") return "Resolve dependency";
  return undefined;
}

function deriveNextAction(t: Task): string {
  if (t.state === "revision_requested") return "Open revision";
  if (t.state === "ready_for_submission") return "Submit for review";
  if (t.state === "under_review") return "Awaiting mentor decision";
  if (t.state === "blocked") return "Resolve blocker";
  if (t.state === "awaiting_clarification") return "Awaiting mentor reply";
  if (t.state === "in_progress") return "Continue in workroom";
  if (t.state === "assigned") return "Accept and start";
  if (t.state === "completed" || t.state === "approved") return "View accepted work";
  return "Open task";
}
