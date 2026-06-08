/**
 * Maps contributor mock tasks → ContributorTaskSummary / Detail shapes
 * used by the real API client. Overlay patches (accept / decline) merge
 * on read so matched tasks behave interactively in dev.
 */

import {
  applyOverlay,
  createOverlayStore,
  type OverlayPatch,
} from "@/lib/enterprise/mocks/overlay";
import type {
  ContributorTaskDetail,
  ContributorTaskSummary,
} from "@/lib/api/contributor-tasks";
import type { SubmissionStatus } from "@/lib/submissions/types";
import { getMockSubmissionForTask as getStaticMockSubmission, type MockSubmission } from "@/mocks/contributor/submissions";
import { MOCK_TASKS, type MockTask } from "@/mocks/contributor/tasks";
import { isAssignedLaneTask } from "@/app/contributor/tasks/lib/task-list-utils";
import type { SubmissionDetail } from "@/lib/submissions/types";

export class MockTaskBridgeError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "MockTaskBridgeError";
  }
}

export const contributorMockTaskOverlay = createOverlayStore<
  Partial<MockTask>
>("glimmora.contributor.mock-tasks.v1");

/** Runtime draft submissions created via Open draft in dev. Keyed by taskId. */
export const contributorMockSubmissionOverlay = createOverlayStore<MockSubmission>(
  "glimmora.contributor.mock-submissions.v1",
);

export function isMockTaskId(id: string): boolean {
  return /^task-\d+$/.test(id);
}

function isMockSubmissionId(id: string): boolean {
  return /^sub-\d+-v\d+$/.test(id);
}

function mergedMockTask(taskId: string): MockTask | null {
  const overlay = contributorMockTaskOverlay.read()[taskId];
  if (overlay?.__deletedAt) return null;
  const base = MOCK_TASKS.find((t) => t.id === taskId);
  if (!base) return null;
  return overlay ? ({ ...base, ...overlay } as MockTask) : base;
}

/** Static mock submission merged with any runtime overlay for this task. */
export function getMockSubmissionForTask(taskId: string): MockSubmission | undefined {
  const patch = contributorMockSubmissionOverlay.read()[taskId];
  if (patch?.__deletedAt) return undefined;
  const base = getStaticMockSubmission(taskId);
  if (patch && Object.keys(patch).length > 0) {
    return base ? ({ ...base, ...patch } as MockSubmission) : (patch as MockSubmission);
  }
  return base;
}

function findMockSubmissionById(
  submissionId: string,
): { taskId: string; submission: MockSubmission; task: MockTask } | null {
  for (const task of MOCK_TASKS) {
    const sub = getMockSubmissionForTask(task.id);
    if (sub?.id === submissionId) {
      const merged = mergedMockTask(task.id);
      if (merged) return { taskId: task.id, submission: sub, task: merged };
    }
  }
  const overlay = contributorMockSubmissionOverlay.read();
  for (const taskId of Object.keys(overlay)) {
    const sub = getMockSubmissionForTask(taskId);
    if (sub?.id === submissionId) {
      const task = mergedMockTask(taskId);
      if (task) return { taskId, submission: sub, task };
    }
  }
  return null;
}

/** Prisma TaskDefinition.status for contributor-facing mock rows. */
function toApiTaskStatus(mock: MockTask): string {
  switch (mock.status) {
    case "matched":
      return "matched";
    case "accepted":
    case "in_progress":
    case "ready_for_submission":
    case "submitted":
    case "under_review":
    case "feedback_requested":
    case "resubmitted":
      return "in_progress";
    case "blocked":
      return "blocked";
    case "awaiting_clarification":
      return "awaiting_clarification";
    case "completed":
      return "accepted";
    case "rejected":
      return "reviewed";
    default:
      return "in_progress";
  }
}

function submissionSummary(sub: MockSubmission) {
  return {
    id: sub.id,
    version: sub.version,
    status: sub.status as SubmissionStatus,
    submittedAt: sub.submittedAt,
    decidedAt: sub.decidedAt,
  };
}

function mockSubmissionToDetail(
  sub: MockSubmission,
  task: MockTask,
): ContributorTaskDetail["submissions"][number] {
  return {
    id: sub.id,
    taskDefinitionId: task.id,
    contributorId: "mock-contributor",
    tenantId: task.sow.tenantId,
    version: sub.version,
    status: sub.status as SubmissionStatus,
    body: sub.body,
    payload: null,
    reviewerId: sub.reviewerId,
    reviewerAssignedAt: sub.submittedAt,
    submittedAt: sub.submittedAt,
    decidedAt: sub.decidedAt,
    aiSuggestedDecision: null,
    aiInvocationId: null,
    decisionRationale: sub.decisionRationale,
    createdAt: sub.submittedAt ?? task.assignedAt,
    updatedAt: sub.decidedAt ?? sub.submittedAt ?? task.assignedAt,
    artifacts: sub.artifacts.map((a) => ({
      id: a.id,
      kind: a.kind,
      name: a.name,
      url: a.url,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      caption: null,
      scanCleared: a.scanCleared,
      scanAttemptedAt: a.scanAttemptedAt,
      scanError: a.scanError,
      createdAt: a.createdAt,
    })),
  };
}

export function mockTaskToSummary(task: MockTask): ContributorTaskSummary {
  const sub = getMockSubmissionForTask(task.id);
  return {
    id: task.id,
    title: task.title,
    externalKey: task.externalKey,
    status: toApiTaskStatus(task),
    requiredSkills: task.requiredSkills,
    estimatedHours: task.estimatedHours,
    complexity: task.complexity,
    acceptanceCriteria: task.acceptanceCriteria.join("\n"),
    agreedRatePerHour: task.agreedRatePerHour,
    agreedCurrency: task.agreedCurrency,
    assignedAt: task.assignedAt,
    acceptedAt: task.acceptedAt,
    submitByAt: task.dueAt,
    updatedAt: task.decidedAt ?? task.acceptedAt ?? task.assignedAt,
    sow: {
      id: task.sow.id,
      title: task.sow.title,
      tenantId: task.sow.tenantId,
      tenantName: task.sow.tenantName,
    },
    milestone: task.milestone,
    latestSubmission: sub ? submissionSummary(sub) : null,
  };
}

export function mockTaskToDetail(task: MockTask): ContributorTaskDetail {
  const sub = getMockSubmissionForTask(task.id);
  const summary = mockTaskToSummary(task);
  return {
    ...summary,
    description: task.description,
    createdAt: task.assignedAt,
    plan: {
      id: `plan-${task.sow.id}`,
      version: 1,
      sow: {
        id: task.sow.id,
        title: task.sow.title,
        tenant: {
          id: task.sow.tenantId,
          name: task.sow.tenantName,
          slug: task.sow.tenantName.toLowerCase(),
        },
      },
    },
    submissions: sub ? [mockSubmissionToDetail(sub, task)] : [],
  };
}

/** All active contributor mock tasks (every lane — assigned page filters client-side). */
export function listContributorMockSummaries(): ContributorTaskSummary[] {
  return MOCK_TASKS.filter((base) => {
    const overlay = contributorMockTaskOverlay.read()[base.id];
    return !overlay?.__deletedAt;
  })
    .map((base) => {
      const task = mergedMockTask(base.id);
      return task ? mockTaskToSummary(task) : null;
    })
    .filter((t): t is ContributorTaskSummary => t !== null)
    .sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
}

/** Assigned-lane tasks only (excludes submissions, revisions, completed, rejected). */
export function listAssignedMockSummaries(): ContributorTaskSummary[] {
  return listContributorMockSummaries().filter(isAssignedLaneTask);
}

export function getMockContributorTaskDetail(
  taskId: string,
): ContributorTaskDetail | null {
  const overlay = contributorMockTaskOverlay.read();
  const patch = overlay[taskId];
  if (patch?.__deletedAt) return null;
  const base = MOCK_TASKS.find((t) => t.id === taskId);
  if (!base) return null;
  const task = patch ? ({ ...base, ...patch } as MockTask) : base;
  return mockTaskToDetail(task);
}

export function acceptMockTask(taskId: string): boolean {
  const overlay = contributorMockTaskOverlay.read()[taskId];
  if (overlay?.__deletedAt) return false;
  const base = MOCK_TASKS.find((t) => t.id === taskId);
  if (!base) return false;
  const current = overlay ? ({ ...base, ...overlay } as MockTask) : base;
  if (current.status !== "matched" || current.acceptedAt) return false;
  contributorMockTaskOverlay.patch(taskId, {
    status: "accepted",
    acceptedAt: new Date().toISOString(),
  });
  return true;
}

export function declineMockTask(taskId: string): boolean {
  if (!MOCK_TASKS.some((t) => t.id === taskId)) return false;
  contributorMockTaskOverlay.remove(taskId);
  contributorMockSubmissionOverlay.remove(taskId);
  return true;
}

export function createMockDraft(
  taskId: string,
  body?: string,
): SubmissionDetail | null {
  if (!isMockTaskId(taskId)) return null;
  const task = mergedMockTask(taskId);
  if (!task) {
    throw new MockTaskBridgeError("Task not found", 404, "not_found");
  }

  const workable = ["accepted", "in_progress", "ready_for_submission"].includes(task.status);
  if (!workable) {
    throw new MockTaskBridgeError(
      `Cannot create a submission on a task in '${task.status}' state — accept it first`,
      400,
      "invalid_state",
    );
  }

  const existing = getMockSubmissionForTask(taskId);
  if (existing && (existing.status === "draft" || existing.status === "feedback_requested")) {
    throw new MockTaskBridgeError(
      `Open draft submission already exists (v${existing.version})`,
      409,
      "conflict",
    );
  }

  const version = existing ? existing.version + 1 : 1;
  const submission: MockSubmission = {
    id: `sub-${taskId.replace("task-", "")}-v${version}`,
    taskId,
    version,
    status: "draft",
    body: body ?? null,
    routing: "mentor",
    submittedAt: null,
    decidedAt: null,
    reviewerId: null,
    reviewerName: null,
    feedback: null,
    decisionRationale: null,
    artifacts: [],
  };

  contributorMockSubmissionOverlay.insert(taskId, submission);
  if (task.status === "accepted") {
    contributorMockTaskOverlay.patch(taskId, { status: "in_progress" });
  }

  return mockSubmissionToDetail(submission, mergedMockTask(taskId) ?? task);
}

export function updateMockDraft(
  submissionId: string,
  input: { body?: string; payload?: Record<string, unknown> },
): SubmissionDetail | null {
  if (!isMockSubmissionId(submissionId)) return null;
  const found = findMockSubmissionById(submissionId);
  if (!found) {
    throw new MockTaskBridgeError("Submission not found", 404, "not_found");
  }
  const { submission, task, taskId } = found;
  if (submission.status !== "draft" && submission.status !== "feedback_requested") {
    throw new MockTaskBridgeError(
      `Cannot edit a submission in '${submission.status}' state`,
      400,
      "invalid_state",
    );
  }

  const next: MockSubmission = {
    ...submission,
    body: input.body !== undefined ? input.body : submission.body,
  };
  contributorMockSubmissionOverlay.insert(taskId, next);
  return mockSubmissionToDetail(next, task);
}

export function submitMockDraft(submissionId: string): SubmissionDetail | null {
  if (!isMockSubmissionId(submissionId)) return null;
  const found = findMockSubmissionById(submissionId);
  if (!found) {
    throw new MockTaskBridgeError("Submission not found", 404, "not_found");
  }
  const { submission, task, taskId } = found;
  if (submission.status !== "draft" && submission.status !== "feedback_requested") {
    throw new MockTaskBridgeError(
      `Cannot submit a submission in '${submission.status}' state`,
      400,
      "invalid_state",
    );
  }

  const now = new Date().toISOString();
  const next: MockSubmission = {
    ...submission,
    status: submission.status === "feedback_requested" ? "resubmitted" : "submitted",
    submittedAt: now,
  };
  contributorMockSubmissionOverlay.insert(taskId, next);
  contributorMockTaskOverlay.patch(taskId, {
    status: next.status === "resubmitted" ? "resubmitted" : "submitted",
  });
  return mockSubmissionToDetail(next, task);
}

export function getMockSubmissionDetail(submissionId: string): SubmissionDetail | null {
  if (!isMockSubmissionId(submissionId)) return null;
  const found = findMockSubmissionById(submissionId);
  if (!found) return null;
  return mockSubmissionToDetail(found.submission, found.task);
}

/** Mock-only fields not on SubmissionDetail (reviewer display name, routing). */
export function getMockSubmissionMeta(submissionId: string): {
  reviewerName: string | null;
  routing: MockSubmission["routing"];
} | null {
  const found = findMockSubmissionById(submissionId);
  if (!found) return null;
  return {
    reviewerName: found.submission.reviewerName,
    routing: found.submission.routing,
  };
}
