/**
 * View-model adapters: real contributor task/submission API → list row
 * shapes the Revisions / Completed pages already render.
 */

import { getTask, type ContributorTaskDetail, type ContributorTaskSummary } from "@/lib/api/contributor-tasks";
import type { CompletedRow, CompletedTaskDetailResponse, RevisionRow } from "@/lib/api/contributor-mock";
import { listMyCredentialsWithFallback, listMyPayouts } from "@/lib/api/contributor-payouts";
import type { SubmissionSummary } from "@/lib/submissions/types";
import { isRevisionLaneTask, isSubmissionLaneTask } from "@/app/contributor/tasks/lib/task-list-utils";
import type { MockCredential, MockPayout, MockSubmission, MockTask } from "@/mocks/contributor";
import type { PayoutStatus } from "@/mocks/contributor/payouts";

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
    // Structured reviewer feedback is fetched live (real) on the revision-detail
    // page via /api/contributor/tasks/:id/review-feedback — never fabricated here.
    feedback: null,
    decisionRationale: null,
    artifacts: [],
  };
}

export function revisionsFromTasks(tasks: ContributorTaskSummary[]): RevisionRow[] {
  return tasks
    .filter(isRevisionLaneTask)
    .map((summary) => {
      const task = toMockTask(summary);
      const submission = toMockSubmission(summary);
      const corrections = submission.feedback?.requiredCorrections ?? [];
      const correctionsAddressed = corrections.filter((c) => c.addressed).length;
      const correctionsTotal = corrections.length;
      return {
        task,
        submission,
        readyToResubmit:
          correctionsTotal > 0 && correctionsAddressed === correctionsTotal,
        correctionsTotal,
        correctionsAddressed,
      };
    });
}

/** Submissions nav — tasks in submitted / under_review / resubmitted. */
export function submissionsFromTasks(tasks: ContributorTaskSummary[]): SubmissionSummary[] {
  // Guard: a task can sit in a submission-lane status while latestSubmission is
  // still null (data lag) — skip those so we don't crash on sub.id below.
  return tasks.filter((t) => isSubmissionLaneTask(t) && t.latestSubmission).map((task) => {
    const sub = task.latestSubmission!;
    return {
      id: sub.id,
      taskDefinitionId: task.id,
      taskTitle: task.title,
      contributorId: "self",
      contributorName: "You",
      version: sub.version,
      status: sub.status,
      submittedAt: sub.submittedAt,
      reviewerId: null,
      reviewerName: null,
      artifactCount: 0,
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
    const task = toMockTask(summary);
    // Prefer the FIXED Glimmora-set payout (payGrossMinor) over rate×hours, which
    // over-counts fixed-price tasks (a ₹3,000 fixed payout showed as ₹30,000).
    // Only fall back to rate×hours for legacy hourly tasks with no fixed amount.
    const fixedMinor =
      (typeof summary.payGrossMinor === "number" && summary.payGrossMinor > 0
        ? summary.payGrossMinor
        : null) ??
      (summary.pricing?.contributorPayout
        ? Math.round(summary.pricing.contributorPayout * 100)
        : null);
    const hours = task.estimatedHours ?? summary.estimatedHours ?? 0;
    const rate = task.agreedRatePerHour ?? summary.agreedRatePerHour ?? 0;
    const payoutMinor = fixedMinor ?? Math.round(hours * rate * 100);
    totalEarnedMinor += payoutMinor;
    return {
      task,
      payoutMinor,
      payoutStatus: "eligible",
      credentialId: undefined,
    };
  });
  return { items, totalEarnedMinor };
}

/* ─────────── Single-item detail composition (real backend, by id) ─────────── */

/** Backend task detail carries submissions[]; the mappers want latestSubmission. */
function withLatestSubmission(task: ContributorTaskDetail): ContributorTaskSummary {
  const s = task.submissions?.[0];
  return {
    ...task,
    latestSubmission: s
      ? {
          id: s.id,
          version: s.version,
          status: s.status,
          submittedAt: s.submittedAt ?? null,
          decidedAt: s.decidedAt ?? null,
        }
      : null,
  };
}

function mapPayoutStatus(s: string): PayoutStatus {
  if (s === "sent") return "paid";
  if (s === "processing" || s === "requested" || s === "on_hold") return "pending";
  if (["eligible", "pending", "paid", "failed", "reversed"].includes(s)) return s as PayoutStatus;
  return "eligible";
}

/** Completed-task detail = real task + latest submission + real payout + real credential (by id). */
export async function getCompletedTaskDetail(taskId: string): Promise<CompletedTaskDetailResponse> {
  const { task } = await getTask(taskId);
  const summary = withLatestSubmission(task);
  const mockTask = toMockTask(summary);
  mockTask.description = task.description ?? mockTask.description;
  const submission = task.submissions?.length ? toMockSubmission(summary) : null;

  let payout: MockPayout | null = null;
  try {
    const { items } = await listMyPayouts();
    const p = items.find((x) => x.taskDefinitionId === taskId);
    if (p) {
      payout = {
        id: p.id,
        taskId,
        taskTitle: task.title,
        amountMinor: p.amountMinor,
        currency: "INR",
        status: mapPayoutStatus(p.status),
        eligibleAt: p.eligibleAt,
        paidAt: p.sentAt ?? null,
        externalRef: p.externalRef,
        failureReason: p.failureReason,
      };
    }
  } catch {
    /* no payout yet */
  }

  let credential: MockCredential | null = null;
  try {
    const { items } = await listMyCredentialsWithFallback();
    credential = items.find((c) => c.taskId === taskId) ?? null;
  } catch {
    /* no credential yet */
  }

  return { task: mockTask, submission, payout, credential };
}

// ── Task history & quality ratings ────────────────────────────────────────────

export interface TaskHistoryRatings {
  final: number | null;
  mentorOverall: number | null;
  qaOverall: number | null;
  mentorRatings: Record<string, number> | null;
  qaRatings: Record<string, number> | null;
  ratedAt: string | null;
}

export interface TaskHistoryEvent {
  at: string;
  kind: string;
  label: string;
  meta?: Record<string, unknown>;
}

export interface TaskHistory {
  taskRef: string;
  ratings: TaskHistoryRatings | null;
  timeline: TaskHistoryEvent[];
}

/**
 * Full lifecycle history for a task — the quality ratings (mentor + QA → final)
 * and a chronological timeline (assigned → submitted → revisions → decisions →
 * QA approval + rating → payout → paid). Best-effort: returns empty on failure.
 */
export async function getTaskHistory(taskId: string): Promise<TaskHistory> {
  const empty: TaskHistory = { taskRef: "", ratings: null, timeline: [] };
  try {
    const res = await fetch(
      `/api/contributor/tasks/${encodeURIComponent(taskId)}/history`,
      { cache: "no-store" },
    );
    if (!res.ok) return empty;
    const body = (await res.json()) as Record<string, unknown>;
    const d = ((body?.data ?? body) ?? {}) as Partial<TaskHistory>;
    return {
      taskRef: String(d.taskRef ?? ""),
      ratings: (d.ratings as TaskHistoryRatings | null) ?? null,
      timeline: Array.isArray(d.timeline) ? (d.timeline as TaskHistoryEvent[]) : [],
    };
  } catch {
    return empty;
  }
}

type RevisionFeedback = NonNullable<MockSubmission["feedback"]>;

/**
 * The revision workroom needs a `feedback` object to render. A comment-only rework
 * carries no structured checklist, so we best-effort fetch the mentor's review
 * feedback and otherwise fall back to an empty (but non-null) object. Without this
 * the workroom showed "No mentor feedback found" and the contributor could never
 * resubmit. Never throws.
 */
async function loadRevisionFeedback(taskId: string): Promise<RevisionFeedback> {
  const empty: RevisionFeedback = { whatWorked: "", requiredCorrections: [], suggestions: [] };
  try {
    const res = await fetch(
      `/api/contributor/tasks/${encodeURIComponent(taskId)}/review-feedback`,
      { cache: "no-store" },
    );
    if (!res.ok) return empty;
    const body = (await res.json()) as Record<string, unknown>;
    const fb = (body?.data ?? body) as Record<string, unknown>;
    const criteria = Array.isArray(fb?.criteria) ? (fb.criteria as Record<string, unknown>[]) : [];
    return {
      whatWorked: String(fb?.reviewer_feedback ?? fb?.reviewerFeedback ?? ""),
      requiredCorrections: criteria
        .filter((c) => String(c?.comment ?? "").trim().length > 0)
        .map((c, i) => ({
          id: String(c?.criterion_id ?? `c-${i}`),
          criterion: String(c?.criterion_id ?? `Correction ${i + 1}`),
          description: String(c?.comment ?? ""),
          severity: "minor" as const,
          addressed: false,
        })),
      suggestions: [],
    };
  } catch {
    return empty;
  }
}

/** Revision-task detail = real task + latest submission, mapped to the view shapes. */
export async function getRevisionTaskDetail(
  taskId: string,
): Promise<{ task: MockTask; submission: MockSubmission }> {
  const { task } = await getTask(taskId);
  const summary = withLatestSubmission(task);
  const mockTask = toMockTask(summary);
  mockTask.description = task.description ?? mockTask.description;
  const submission = toMockSubmission(summary);
  if (!submission.feedback) {
    submission.feedback = await loadRevisionFeedback(taskId);
  }
  return { task: mockTask, submission };
}
