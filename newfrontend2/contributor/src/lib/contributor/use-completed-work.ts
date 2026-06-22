/**
 * Live-store-backed completed work list for the Completed Work archive.
 */

"use client";

import * as React from "react";
import {
  useContributorTasksStore,
  type Task,
} from "@/lib/stores/contributor-tasks-store";
import type { CompletedWorkItem } from "@/mocks/data/contributor-completed-work";

export function useCompletedWork(): CompletedWorkItem[] {
  const tasksById = useContributorTasksStore((s) => s.tasksById);
  return React.useMemo(
    () =>
      Object.values(tasksById)
        .filter((t) => t.state === "completed" || t.state === "approved")
        .map(taskToCompletedWork),
    [tasksById],
  );
}

function taskToCompletedWork(t: Task): CompletedWorkItem {
  return {
    id: `cw-${t.id}`,
    taskId: t.id,
    title: t.title,
    shortSummary: t.shortDescription,
    project: t.project,
    portfolio: t.portfolio,
    skill: t.skill,
    skillLevel: t.skillLevel,
    acceptedAt: t.acceptedAt ?? t.lastActivityAt,
    payoutAmount: t.payoutAmount,
    payoutReference: t.payoutReference,
    rounds: t.reworkRound,
    mentor: { name: t.mentor.name, initials: t.mentor.initials },
    whatWorked:
      t.whatWorked ??
      t.mentorFeedback?.whatWorked ??
      "Strong submission — clean evidence and on-spec delivery.",
    credential: t.credential,
    portfolioEligible: t.portfolioEligible ?? true,
    portfolioShared: t.portfolioShared,
    evidenceCount: t.evidence.length || 4,
    yearMonth: extractYearMonth(t.acceptedAt ?? t.lastActivityAt),
    firstTryAccept: t.firstTryAccept ?? t.reworkRound === 1,
  };
}

function extractYearMonth(raw: string): string {
  // Accepts "May 18, 2026" or "2026-05-18" or "just now"
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  return "2026-05";
}
