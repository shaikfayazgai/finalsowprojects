/**
 * Live-store-backed revision rows for the revisions workspace.
 *
 * Projects unified store tasks (in any revision-related state) into the
 * `RevisionRow` shape the existing queue components are typed against.
 */

"use client";

import * as React from "react";
import {
  useContributorTasksStore,
  type Task,
} from "@/lib/stores/contributor-tasks-store";
import {
  type RevisionRow,
  type RevisionWorkflowState,
} from "@/mocks/data/contributor-revision-queue";

export function useRevisionRows(): RevisionRow[] {
  const tasksById = useContributorTasksStore((s) => s.tasksById);
  return React.useMemo(
    () => Object.values(tasksById).filter(isInRevisionLifecycle).map(taskToRevisionRow),
    [tasksById],
  );
}

function isInRevisionLifecycle(t: Task): boolean {
  if (t.state === "revision_requested") return true;
  if (t.state === "awaiting_clarification" && t.revisionSubState) return true;
  if (
    t.state === "ready_for_submission" &&
    t.revisionSubState === "ready_for_resubmission"
  ) return true;
  if (
    t.state === "under_review" &&
    t.revisionSubState === "resubmitted_under_review" &&
    t.reworkRound > 1
  ) return true;
  return false;
}

function taskToRevisionRow(t: Task): RevisionRow {
  const subState: RevisionWorkflowState =
    t.revisionSubState ??
    (t.state === "ready_for_submission"
      ? "ready_for_resubmission"
      : t.state === "under_review"
      ? "resubmitted_under_review"
      : t.state === "awaiting_clarification"
      ? "awaiting_clarification"
      : "feedback_received");

  const corrections = (t.mentorFeedback?.requiredCorrections ?? []).map((c) => ({
    id: c.id,
    criterion: c.criterion,
    description: c.description,
    severity: c.severity,
    category: deriveCategory(c.criterion),
    resolved: t.resolvedCorrections.includes(c.id),
  }));

  return {
    id: `rev-${t.id}`,
    taskId: t.id,
    title: t.title,
    shortDescription: t.shortDescription,
    project: t.project,
    portfolio: t.portfolio,
    priority: t.priority,
    skill: `${t.skill} · ${t.skillLevel}`,
    state: subState,
    reworkRound: t.reworkRound,
    totalRounds: t.totalRounds,
    feedbackReceivedAt: t.mentorFeedback?.receivedAt ?? t.lastActivityAt,
    dueAt: t.deadline,
    hoursToDue: t.deadlineHoursRemaining,
    lastActivityAt: t.lastActivityAt,
    mentor: t.mentor,
    whatWorked: t.mentorFeedback?.whatWorked ?? "",
    mentorGuidance:
      corrections.length === 0
        ? "All corrections resolved — ready to resubmit when you are."
        : `${corrections.filter((c) => !c.resolved).length} correction${corrections.filter((c) => !c.resolved).length === 1 ? "" : "s"} remaining · take them in order.`,
    corrections,
    optionalSuggestions: t.mentorFeedback?.suggestions ?? [],
    evidenceDeltas: [],
    draftNote: t.draftNotes,
    draftSavedAt: t.draftSavedAt,
    aiHints: [],
    readinessScore: t.readinessScore,
    nextRequiredAction: deriveNext(t, corrections.filter((c) => !c.resolved).length),
    payoutAmount: t.payoutAmount,
  };
}

function deriveCategory(criterion: string): RevisionRow["corrections"][number]["category"] {
  const c = criterion.toLowerCase();
  if (c.includes("access") || c.includes("a11y") || c.includes("focus")) return "Accessibility";
  if (c.includes("test") || c.includes("coverage")) return "Testing";
  if (c.includes("doc") || c.includes("naming")) return "Docs";
  if (c.includes("require") || c.includes("spec")) return "Requirements";
  if (c.includes("quality") || c.includes("polish")) return "Quality";
  return "Functionality";
}

function deriveNext(t: Task, unresolved: number): string {
  if (unresolved === 0) return "Resubmit when ready";
  if (t.state === "awaiting_clarification") return "Awaiting mentor reply";
  const first = t.mentorFeedback?.requiredCorrections?.find(
    (c) => !t.resolvedCorrections.includes(c.id),
  );
  return first ? `Address "${first.criterion}"` : "Continue revision";
}
