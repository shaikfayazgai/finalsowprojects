/**
 * View-model adapters: real contributor task/submission API → list row
 * shapes the Revisions / Completed pages already render.
 */

import type { ContributorTaskSummary } from "@/lib/api/contributor-tasks";
import type { CompletedRow, RevisionRow } from "@/lib/api/contributor-mock";
import type { SubmissionSummary } from "@/lib/submissions/types";
import { isRevisionLaneTask, isSubmissionLaneTask } from "@/app/contributor/tasks/lib/task-list-utils";
import { getMockSubmissionForTask } from "@/lib/contributor/mock-task-bridge";
import { MOCK_TASKS } from "@/mocks/contributor/tasks";
import { MOCK_PAYOUTS } from "@/mocks/contributor/payouts";
import { MOCK_CREDENTIALS } from "@/mocks/contributor/credentials";
import type { MockSubmission, MockTask } from "@/mocks/contributor";

function synthDueAt(task: ContributorTaskSummary): string {
  if (task.assignedAt && task.estimatedHours) {
    return new Date(
      new Date(task.assignedAt).getTime() + task.estimatedHours * 3_600_000,
    ).toISOString();
  }
  return task.updatedAt;
}

function toMockTask(task: ContributorTaskSummary): MockTask {
  return {
    id: task.id,
    externalKey: task.externalKey ?? task.id,
    title: task.title,
    status: task.status as MockTask["status"],
    description: "",
    acceptanceCriteria: task.acceptanceCriteria
      ? task.acceptanceCriteria.split(/\r?\n/).filter(Boolean)
      : [],
    requiredSkills: task.requiredSkills,
    estimatedHours: task.estimatedHours ?? 0,
    complexity: (task.complexity as MockTask["complexity"]) ?? "medium",
    agreedCurrency: "INR",
    agreedRatePerHour: task.agreedRatePerHour ?? 0,
    assignedAt: task.assignedAt ?? task.updatedAt,
    acceptedAt: task.acceptedAt,
    decidedAt: task.latestSubmission?.decidedAt ?? null,
    dueAt: synthDueAt(task),
    sow: {
      id: task.sow?.id ?? "—",
      title: task.sow?.title ?? "—",
      tenantId: task.sow?.tenantId ?? "—",
      tenantName: task.sow?.tenantName ?? "—",
    },
    milestone: task.milestone,
    mentor: { id: "—", name: "Reviewer", initials: "RV", role: "Mentor" },
    round: task.latestSubmission?.version ?? 1,
    totalRounds: 3,
    criteriaAddressed: [],
    readinessPct: task.latestSubmission?.status === "feedback_requested" ? 40 : 70,
  };
}

function toMockSubmission(
  task: ContributorTaskSummary,
): MockSubmission {
  const sub = task.latestSubmission;
  return {
    id: sub?.id ?? `${task.id}-sub`,
    taskId: task.id,
    version: sub?.version ?? 1,
    status: sub?.status ?? "draft",
    body: null,
    routing: "mentor",
    submittedAt: sub?.submittedAt ?? null,
    decidedAt: sub?.decidedAt ?? null,
    reviewerId: null,
    reviewerName: "Reviewer",
    feedback: sub?.status === "feedback_requested"
      ? {
          whatWorked: "Solid structure overall.",
          requiredCorrections: [
            {
              id: "c1",
              criterion: "Validation",
              description: "Address validation timing on first render",
              severity: "major",
              addressed: false,
            },
            {
              id: "c2",
              criterion: "Focus",
              description: "Fix focus ring clipping in modal overflow",
              severity: "major",
              addressed: false,
            },
          ],
          suggestions: [],
        }
      : null,
    decisionRationale: null,
    artifacts: [],
  };
}

export function revisionsFromTasks(tasks: ContributorTaskSummary[]): RevisionRow[] {
  return tasks
    .filter(isRevisionLaneTask)
    .map((summary) => {
      const mockTask = MOCK_TASKS.find((m) => m.id === summary.id) ?? toMockTask(summary);
      const mockSub = getMockSubmissionForTask(summary.id) ?? toMockSubmission(summary);
      const corrections = mockSub.feedback?.requiredCorrections ?? [];
      const correctionsAddressed = corrections.filter((c) => c.addressed).length;
      const correctionsTotal = corrections.length;
      return {
        task: mockTask,
        submission: mockSub,
        readyToResubmit:
          correctionsTotal > 0 && correctionsAddressed === correctionsTotal,
        correctionsTotal,
        correctionsAddressed,
      };
    });
}

/** Submissions nav — tasks in submitted / under_review / resubmitted. */
export function submissionsFromTasks(tasks: ContributorTaskSummary[]): SubmissionSummary[] {
  return tasks.filter(isSubmissionLaneTask).map((task) => {
    const sub = task.latestSubmission!;
    const mockSub = getMockSubmissionForTask(task.id);
    return {
      id: sub.id,
      taskDefinitionId: task.id,
      taskTitle: task.title,
      contributorId: "mock-contributor",
      contributorName: "You",
      version: sub.version,
      status: sub.status,
      submittedAt: sub.submittedAt,
      reviewerId: mockSub?.reviewerId ?? null,
      reviewerName: mockSub?.reviewerName ?? null,
      artifactCount: mockSub?.artifacts.length ?? 0,
    };
  });
}

export function completedFromTasks(tasks: ContributorTaskSummary[]): {
  items: CompletedRow[];
  totalEarnedMinor: number;
} {
  const completed = tasks.filter(
    (t) =>
      t.status === "accepted" ||
      t.status === "completed" ||
      t.latestSubmission?.status === "accepted",
  );
  let totalEarnedMinor = 0;
  const items: CompletedRow[] = completed.map((summary) => {
    const mockTask = MOCK_TASKS.find((m) => m.id === summary.id) ?? toMockTask(summary);
    const payout = MOCK_PAYOUTS.find((p) => p.taskId === summary.id);
    const credential = MOCK_CREDENTIALS.find((c) => c.taskId === summary.id);
    const hours = mockTask.estimatedHours ?? summary.estimatedHours ?? 0;
    const rate = mockTask.agreedRatePerHour ?? summary.agreedRatePerHour ?? 0;
    const payoutMinor =
      payout?.amountMinor ?? Math.round(hours * rate * 100);
    totalEarnedMinor += payoutMinor;
    return {
      task: mockTask,
      payoutMinor,
      payoutStatus: payout?.status ?? "eligible",
      credentialId: credential?.id,
    };
  });
  return { items, totalEarnedMinor };
}
