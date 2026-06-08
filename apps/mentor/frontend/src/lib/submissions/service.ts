/**
 * Submission service — server-side functions for the contributor
 * delivery flow. Each function expects a Prisma transaction with
 * `app.tenant_id` already bound for RLS.
 *
 * Core flow (criterion #10):
 *   1. assignTaskToContributor — operator/matching action attaches a
 *      contributor to a TaskDefinition.
 *   2. createDraftSubmission — contributor opens a new submission
 *      (version = max+1) once accepted.
 *   3. updateDraftSubmission — body/payload edits while in draft or
 *      feedback_requested.
 *   4. attachArtifact / removeArtifact — files/links.
 *   5. submitSubmission — promotes draft → submitted, stamps
 *      submittedAt, flips TaskDefinition.status to 'submitted'.
 *      Mentor queue now surfaces it.
 *
 * Mentor pickup + decision lands in M16; this slice ends at the
 * "Under review" confirmation criterion #10 names.
 */

import { Prisma } from "@/generated/prisma/client";
import { markPayoutEligibleOnAcceptance } from "@/lib/payouts/service";
import type { PayoutDetail } from "@/lib/payouts/types";
import { issueCredentialOnAcceptance } from "@/lib/credentials/service";
import type { CredentialDetail } from "@/lib/credentials/types";
import { notifyEnterpriseReviewersOnMentorAccept, notifyEnterpriseReviewersOnInternalSubmit } from "@/lib/enterprise-review/service";
import { isInternalReviewPath } from "@/lib/workforce/policies";
import { SYSTEM_ACTOR } from "@/lib/audit";
import type {
  AttachArtifactInput,
  CreateDraftInput,
  SubmissionArtifactDetail,
  SubmissionDetail,
  SubmissionStatus,
  SubmissionSummary,
  UpdateDraftInput,
  ArtifactKind,
} from "./types";

type Tx = Prisma.TransactionClient;

export class SubmissionServiceError extends Error {
  constructor(
    message: string,
    public code:
      | "not_found"
      | "forbidden"
      | "invalid_state"
      | "validation"
      | "conflict",
  ) {
    super(message);
    this.name = "SubmissionServiceError";
  }
}

/* ─────────────────────────── Mappers ─────────────────────────── */

function toIso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

function toArtifact(row: {
  id: string;
  kind: string;
  name: string;
  url: string;
  mimeType: string | null;
  sizeBytes: number | null;
  caption: string | null;
  scanCleared: boolean;
  scanAttemptedAt: Date | null;
  scanError: string | null;
  createdAt: Date;
}): SubmissionArtifactDetail {
  return {
    id: row.id,
    kind: row.kind as ArtifactKind,
    name: row.name,
    url: row.url,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    caption: row.caption,
    scanCleared: row.scanCleared,
    scanAttemptedAt: row.scanAttemptedAt ? row.scanAttemptedAt.toISOString() : null,
    scanError: row.scanError,
    createdAt: row.createdAt.toISOString(),
  };
}

function toDetail(row: {
  id: string;
  taskDefinitionId: string;
  contributorId: string;
  tenantId: string;
  version: number;
  status: string;
  body: string | null;
  payload: Prisma.JsonValue;
  reviewerId: string | null;
  reviewerAssignedAt: Date | null;
  submittedAt: Date | null;
  decidedAt: Date | null;
  aiSuggestedDecision: string | null;
  aiInvocationId: string | null;
  decisionRationale: string | null;
  createdAt: Date;
  updatedAt: Date;
  artifacts?: Array<Parameters<typeof toArtifact>[0]>;
}): SubmissionDetail {
  return {
    id: row.id,
    taskDefinitionId: row.taskDefinitionId,
    contributorId: row.contributorId,
    tenantId: row.tenantId,
    version: row.version,
    status: row.status as SubmissionStatus,
    body: row.body,
    payload: row.payload as Record<string, unknown> | null,
    reviewerId: row.reviewerId,
    reviewerAssignedAt: toIso(row.reviewerAssignedAt),
    submittedAt: toIso(row.submittedAt),
    decidedAt: toIso(row.decidedAt),
    aiSuggestedDecision:
      row.aiSuggestedDecision as SubmissionDetail["aiSuggestedDecision"],
    aiInvocationId: row.aiInvocationId,
    decisionRationale: row.decisionRationale,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    artifacts: (row.artifacts ?? []).map(toArtifact),
  };
}

/* ───────────────────────── Task assignment ───────────────────────── */

/**
 * Assign a TaskDefinition to a contributor. Idempotent if already
 * assigned to the same contributor.
 *
 * Requires the task to be in status 'ready' or 'matched'. Sets
 * status='matched' + records assignedAt. The contributor still has
 * to explicitly accept before they can create a submission.
 */
export async function assignTaskToContributor(
  tx: Tx,
  args: { taskId: string; contributorUserId: string },
): Promise<{ taskId: string; contributorId: string }> {
  const task = await tx.taskDefinition.findFirst({
    where: { id: args.taskId },
  });
  if (!task) {
    throw new SubmissionServiceError("Task not found in tenant scope", "not_found");
  }
  if (task.status !== "ready" && task.status !== "matched") {
    throw new SubmissionServiceError(
      `Cannot assign a task in '${task.status}' state — must be 'ready' or already 'matched'`,
      "invalid_state",
    );
  }
  // Verify contributor exists + is a contributor role
  const contrib = await tx.user.findUnique({
    where: { id: args.contributorUserId },
    select: { id: true, role: true },
  });
  if (!contrib || contrib.role !== "contributor") {
    throw new SubmissionServiceError(
      "Target user is not a contributor",
      "validation",
    );
  }

  await tx.taskDefinition.update({
    where: { id: task.id },
    data: {
      assignedContributorId: args.contributorUserId,
      assignedAt: task.assignedContributorId === args.contributorUserId
        ? task.assignedAt
        : new Date(),
      status: "matched",
    },
  });
  return { taskId: task.id, contributorId: args.contributorUserId };
}

/**
 * Contributor accepts the assignment: status 'matched' → 'in_progress'.
 * Records acceptedAt. Self-only — caller must be the assigned contributor.
 */
export async function acceptTaskAssignment(
  tx: Tx,
  args: { taskId: string; actorUserId: string },
): Promise<{ taskId: string }> {
  const task = await tx.taskDefinition.findFirst({
    where: { id: args.taskId },
  });
  if (!task) throw new SubmissionServiceError("Task not found", "not_found");
  if (task.assignedContributorId !== args.actorUserId) {
    throw new SubmissionServiceError(
      "Only the assigned contributor can accept this task",
      "forbidden",
    );
  }
  if (task.status !== "matched") {
    throw new SubmissionServiceError(
      `Cannot accept a task in '${task.status}' state`,
      "invalid_state",
    );
  }
  await tx.taskDefinition.update({
    where: { id: task.id },
    data: { status: "in_progress", acceptedAt: new Date() },
  });
  return { taskId: task.id };
}

/* ─────────────────────────── Submissions ─────────────────────────── */

export async function createDraftSubmission(
  tx: Tx,
  args: { actorUserId: string; input: CreateDraftInput },
): Promise<SubmissionDetail> {
  const { actorUserId, input } = args;
  const task = await tx.taskDefinition.findFirst({
    where: { id: input.taskDefinitionId },
  });
  if (!task) throw new SubmissionServiceError("Task not found", "not_found");
  if (task.assignedContributorId !== actorUserId) {
    throw new SubmissionServiceError(
      "Only the assigned contributor can submit on this task",
      "forbidden",
    );
  }
  if (task.status !== "in_progress" && task.status !== "submitted") {
    throw new SubmissionServiceError(
      `Cannot create a submission on a task in '${task.status}' state — accept it first`,
      "invalid_state",
    );
  }

  // Disallow a second open draft when one already exists for this task
  // by the same contributor — keeps the queue clean.
  const existingOpen = await tx.submission.findFirst({
    where: {
      taskDefinitionId: task.id,
      contributorId: actorUserId,
      status: { in: ["draft", "feedback_requested"] },
      deletedAt: null,
    },
  });
  if (existingOpen) {
    throw new SubmissionServiceError(
      `Open draft submission already exists (v${existingOpen.version})`,
      "conflict",
    );
  }

  // Pick next version
  const last = await tx.submission.findFirst({
    where: { taskDefinitionId: task.id, deletedAt: null },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const nextVersion = (last?.version ?? 0) + 1;

  const sub = await tx.submission.create({
    data: {
      taskDefinitionId: task.id,
      contributorId: actorUserId,
      tenantId: task.tenantId,
      version: nextVersion,
      status: "draft",
      body: input.body ?? null,
      payload: (input.payload as Prisma.InputJsonValue | undefined) ?? Prisma.JsonNull,
    },
    include: { artifacts: true },
  });
  return toDetail(sub);
}

export async function updateDraftSubmission(
  tx: Tx,
  args: { submissionId: string; actorUserId: string; input: UpdateDraftInput },
): Promise<SubmissionDetail> {
  const { submissionId, actorUserId, input } = args;
  const sub = await tx.submission.findFirst({
    where: { id: submissionId, deletedAt: null },
  });
  if (!sub) throw new SubmissionServiceError("Submission not found", "not_found");
  if (sub.contributorId !== actorUserId) {
    throw new SubmissionServiceError(
      "Only the submission owner can edit",
      "forbidden",
    );
  }
  if (sub.status !== "draft" && sub.status !== "feedback_requested") {
    throw new SubmissionServiceError(
      `Cannot edit a submission in '${sub.status}' state`,
      "invalid_state",
    );
  }
  const data: Prisma.SubmissionUpdateInput = {};
  if (input.body !== undefined) data.body = input.body;
  if (input.payload !== undefined) {
    data.payload = input.payload as Prisma.InputJsonValue;
  }
  if (Object.keys(data).length === 0) {
    // No-op update is allowed (UI may call this on tab change).
    return toDetail(await reload(tx, sub.id));
  }
  await tx.submission.update({ where: { id: sub.id }, data });
  return toDetail(await reload(tx, sub.id));
}

async function reload(tx: Tx, submissionId: string) {
  const sub = await tx.submission.findUnique({
    where: { id: submissionId },
    include: { artifacts: true },
  });
  if (!sub) throw new SubmissionServiceError("Submission vanished", "not_found");
  return sub;
}

/* ─────────────────────────── Artifacts ─────────────────────────── */

export async function attachArtifact(
  tx: Tx,
  args: {
    submissionId: string;
    actorUserId: string;
    input: AttachArtifactInput;
  },
): Promise<SubmissionArtifactDetail> {
  const sub = await tx.submission.findFirst({
    where: { id: args.submissionId, deletedAt: null },
  });
  if (!sub) throw new SubmissionServiceError("Submission not found", "not_found");
  if (sub.contributorId !== args.actorUserId) {
    throw new SubmissionServiceError(
      "Only the submission owner can attach artifacts",
      "forbidden",
    );
  }
  if (sub.status !== "draft" && sub.status !== "feedback_requested") {
    throw new SubmissionServiceError(
      `Cannot attach artifacts to a submission in '${sub.status}' state`,
      "invalid_state",
    );
  }
  if (!args.input.name.trim()) {
    throw new SubmissionServiceError("artifact name required", "validation");
  }
  if (!args.input.url.trim()) {
    throw new SubmissionServiceError("artifact url required", "validation");
  }

  // Defaults: links + evidence are scan-cleared at create; files need scan.
  const defaultCleared = args.input.kind === "file" ? false : true;
  const scanCleared = args.input.scanCleared ?? defaultCleared;

  const row = await tx.submissionArtifact.create({
    data: {
      submissionId: sub.id,
      tenantId: sub.tenantId,
      kind: args.input.kind,
      name: args.input.name.trim(),
      url: args.input.url.trim(),
      mimeType: args.input.mimeType ?? null,
      sizeBytes: args.input.sizeBytes ?? null,
      caption: args.input.caption ?? null,
      scanCleared,
    },
  });
  return toArtifact(row);
}

export async function removeArtifact(
  tx: Tx,
  args: { artifactId: string; actorUserId: string },
): Promise<void> {
  const art = await tx.submissionArtifact.findFirst({
    where: { id: args.artifactId },
    include: { submission: { select: { contributorId: true, status: true } } },
  });
  if (!art) throw new SubmissionServiceError("Artifact not found", "not_found");
  if (art.submission.contributorId !== args.actorUserId) {
    throw new SubmissionServiceError(
      "Only the submission owner can remove artifacts",
      "forbidden",
    );
  }
  if (art.submission.status !== "draft" && art.submission.status !== "feedback_requested") {
    throw new SubmissionServiceError(
      `Cannot remove artifacts from a submission in '${art.submission.status}' state`,
      "invalid_state",
    );
  }
  await tx.submissionArtifact.delete({ where: { id: art.id } });
}

/* ─────────────────────────── Submit (commit) ─────────────────────── */

/**
 * Promote a draft (or feedback_requested) submission to 'submitted'.
 * This is the contributor's commit action. After this:
 *   - body / payload / artifacts are read-only until mentor flips
 *     status back to 'feedback_requested'.
 *   - the mentor queue surfaces the submission.
 *   - TaskDefinition.status moves to 'submitted'.
 *
 * For a feedback_requested submission, the status moves to
 * 'resubmitted' instead of 'submitted'; the mentor queue treats both
 * the same way.
 */
export async function submitSubmission(
  tx: Tx,
  args: { submissionId: string; actorUserId: string },
): Promise<SubmissionDetail> {
  const sub = await tx.submission.findFirst({
    where: { id: args.submissionId, deletedAt: null },
    include: { artifacts: true },
  });
  if (!sub) throw new SubmissionServiceError("Submission not found", "not_found");
  if (sub.contributorId !== args.actorUserId) {
    throw new SubmissionServiceError(
      "Only the submission owner can submit",
      "forbidden",
    );
  }
  if (sub.status !== "draft" && sub.status !== "feedback_requested") {
    throw new SubmissionServiceError(
      `Cannot submit a submission in '${sub.status}' state`,
      "invalid_state",
    );
  }
  // Phase 1 sanity check: at least 1 artifact OR a non-empty body.
  if (!sub.body && sub.artifacts.length === 0) {
    throw new SubmissionServiceError(
      "Add at least one artifact or write a body description before submitting",
      "validation",
    );
  }
  // M20 guard: every file artifact must have passed the scan before
  // the contributor can commit. Links + evidence default scanCleared=true
  // at attach time so they're not affected; uploaded files need an
  // explicit scan pass.
  const unscannedFiles = sub.artifacts.filter(
    (a) => a.kind === "file" && !a.scanCleared,
  );
  if (unscannedFiles.length > 0) {
    throw new SubmissionServiceError(
      unscannedFiles.length === 1
        ? `Cannot submit — file "${unscannedFiles[0].name}" hasn't passed our virus + plagiarism scan yet. Try again in a moment.`
        : `Cannot submit — ${unscannedFiles.length} files haven't passed our virus + plagiarism scan yet. Try again in a moment.`,
      "invalid_state",
    );
  }

  const now = new Date();
  const newStatus: SubmissionStatus =
    sub.status === "feedback_requested" ? "resubmitted" : "submitted";

  await tx.submission.update({
    where: { id: sub.id },
    data: { status: newStatus, submittedAt: now },
  });

  // Flip the task definition status so PMOs / matching engine know
  // it's no longer 'in_progress'.
  await tx.taskDefinition.update({
    where: { id: sub.taskDefinitionId },
    data: { status: "submitted" },
  });

  const task = await tx.taskDefinition.findFirst({
    where: { id: sub.taskDefinitionId },
    select: { reviewPath: true, title: true, tenantId: true },
  });

  if (task && isInternalReviewPath(task.reviewPath)) {
    await tx.submission.update({
      where: { id: sub.id },
      data: {
        status: "accepted",
        decidedAt: now,
        decisionRationale: "internal_review_path:auto_enterprise_queue",
      },
    });
    try {
      await notifyEnterpriseReviewersOnInternalSubmit(tx, {
        submissionId: sub.id,
        taskId: sub.taskDefinitionId,
        taskTitle: task.title,
        tenantId: task.tenantId,
        actor: SYSTEM_ACTOR,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[submitSubmission] internal enterprise-reviewer notify failed", err);
    }
  }

  return toDetail(await reload(tx, sub.id));
}

/**
 * Contributor withdraws an in-flight submission. Transitions
 * {submitted | under_review | resubmitted} → draft, clears submittedAt,
 * and flips the task back to in_progress so the contributor can keep
 * working. Mentor portal queue will drop the row on next read because
 * the status check there filters by submitted/under_review/resubmitted.
 *
 * Spec §5.G.2.
 */
export async function withdrawSubmission(
  tx: Tx,
  args: { submissionId: string; actorUserId: string },
): Promise<SubmissionDetail> {
  const sub = await tx.submission.findFirst({
    where: { id: args.submissionId, deletedAt: null },
  });
  if (!sub) throw new SubmissionServiceError("Submission not found", "not_found");
  if (sub.contributorId !== args.actorUserId) {
    throw new SubmissionServiceError(
      "Only the submission owner can withdraw it",
      "forbidden",
    );
  }
  if (
    sub.status !== "submitted" &&
    sub.status !== "under_review" &&
    sub.status !== "resubmitted"
  ) {
    throw new SubmissionServiceError(
      `Cannot withdraw a submission in '${sub.status}' state`,
      "invalid_state",
    );
  }

  await tx.submission.update({
    where: { id: sub.id },
    data: { status: "draft", submittedAt: null },
  });

  await tx.taskDefinition.update({
    where: { id: sub.taskDefinitionId },
    data: { status: "in_progress" },
  });

  return toDetail(await reload(tx, sub.id));
}

/* ───────────────────────── Read helpers ───────────────────────── */

export async function getSubmissionDetail(
  tx: Tx,
  submissionId: string,
): Promise<SubmissionDetail | null> {
  const sub = await tx.submission.findFirst({
    where: { id: submissionId, deletedAt: null },
    include: { artifacts: true },
  });
  return sub ? toDetail(sub) : null;
}

export interface ListMentorQueueOptions {
  tenantId: string;
  /** Filter to a specific reviewer (their queue). Null = unclaimed; undefined = all. */
  reviewerId?: string | null;
  /** Default: ['submitted', 'resubmitted']. */
  statuses?: SubmissionStatus[];
  limit?: number;
}

export async function listMentorQueue(
  tx: Tx,
  options: ListMentorQueueOptions,
): Promise<SubmissionSummary[]> {
  const statuses = options.statuses ?? ["submitted", "resubmitted", "under_review"];
  const where: Prisma.SubmissionWhereInput = {
    tenantId: options.tenantId,
    deletedAt: null,
    status: { in: statuses },
    taskDefinition: {
      OR: [
        { reviewPath: null },
        { reviewPath: { notIn: ["internal", "auto_accept"] } },
      ],
    },
  };
  if (options.reviewerId === null) where.reviewerId = null;
  else if (typeof options.reviewerId === "string") where.reviewerId = options.reviewerId;

  const rows = await tx.submission.findMany({
    where,
    orderBy: [{ submittedAt: "asc" }, { createdAt: "asc" }],
    take: options.limit ?? 50,
    include: {
      taskDefinition: { select: { title: true } },
      contributor: { select: { firstName: true, lastName: true } },
      _count: { select: { artifacts: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    taskDefinitionId: r.taskDefinitionId,
    taskTitle: r.taskDefinition.title,
    contributorId: r.contributorId,
    contributorName: `${r.contributor.firstName} ${r.contributor.lastName}`.trim(),
    version: r.version,
    status: r.status as SubmissionStatus,
    submittedAt: r.submittedAt?.toISOString() ?? null,
    reviewerId: r.reviewerId,
    artifactCount: r._count.artifacts,
  }));
}

/**
 * The contributor's own list — submissions across tasks. Used by the
 * contributor's task feed / "my work" view.
 */
export async function listMySubmissions(
  tx: Tx,
  args: { contributorUserId: string; statuses?: SubmissionStatus[]; limit?: number },
): Promise<SubmissionSummary[]> {
  const where: Prisma.SubmissionWhereInput = {
    contributorId: args.contributorUserId,
    deletedAt: null,
    ...(args.statuses && args.statuses.length > 0
      ? { status: { in: args.statuses } }
      : {}),
  };
  const rows = await tx.submission.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: args.limit ?? 50,
    include: {
      taskDefinition: { select: { title: true } },
      contributor: { select: { firstName: true, lastName: true } },
      _count: { select: { artifacts: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    taskDefinitionId: r.taskDefinitionId,
    taskTitle: r.taskDefinition.title,
    contributorId: r.contributorId,
    contributorName: `${r.contributor.firstName} ${r.contributor.lastName}`.trim(),
    version: r.version,
    status: r.status as SubmissionStatus,
    submittedAt: r.submittedAt?.toISOString() ?? null,
    reviewerId: r.reviewerId,
    artifactCount: r._count.artifacts,
  }));
}

/* ════════════════════════ M16 — Mentor review ═════════════════════ */

export type MentorDecision = "accept" | "reject" | "feedback_requested";

/**
 * Mentor claims a submission from the queue. Flips status to
 * 'under_review' and records reviewerId + reviewerAssignedAt.
 *
 * Idempotent if already claimed by the same mentor. Returns conflict
 * if a different mentor already holds the submission — release first.
 */
export async function claimSubmissionForReview(
  tx: Tx,
  args: { submissionId: string; reviewerId: string },
): Promise<SubmissionDetail> {
  const { submissionId, reviewerId } = args;
  const sub = await tx.submission.findFirst({
    where: { id: submissionId, deletedAt: null },
  });
  if (!sub) throw new SubmissionServiceError("Submission not found", "not_found");
  if (sub.status !== "submitted" && sub.status !== "resubmitted" && sub.status !== "under_review") {
    throw new SubmissionServiceError(
      `Cannot claim a submission in '${sub.status}' state`,
      "invalid_state",
    );
  }
  if (sub.reviewerId && sub.reviewerId !== reviewerId) {
    throw new SubmissionServiceError(
      `Already claimed by another reviewer`,
      "conflict",
    );
  }

  await tx.submission.update({
    where: { id: sub.id },
    data: {
      status: "under_review",
      reviewerId,
      reviewerAssignedAt:
        sub.reviewerId === reviewerId && sub.reviewerAssignedAt
          ? sub.reviewerAssignedAt
          : new Date(),
    },
  });

  return toDetail(await reload(tx, sub.id));
}

/**
 * Mentor releases a claim. Flips status back to 'submitted' and
 * clears reviewer fields. Only the current claimant can release.
 */
export async function releaseSubmissionClaim(
  tx: Tx,
  args: { submissionId: string; reviewerId: string },
): Promise<SubmissionDetail> {
  const { submissionId, reviewerId } = args;
  const sub = await tx.submission.findFirst({
    where: { id: submissionId, deletedAt: null },
  });
  if (!sub) throw new SubmissionServiceError("Submission not found", "not_found");
  if (sub.reviewerId !== reviewerId) {
    throw new SubmissionServiceError(
      "Only the current claimant can release",
      "forbidden",
    );
  }
  if (sub.status !== "under_review") {
    throw new SubmissionServiceError(
      `Cannot release a submission in '${sub.status}' state`,
      "invalid_state",
    );
  }
  await tx.submission.update({
    where: { id: sub.id },
    data: {
      status: "submitted",
      reviewerId: null,
      reviewerAssignedAt: null,
    },
  });
  return toDetail(await reload(tx, sub.id));
}

export interface DecideSubmissionInput {
  decision: MentorDecision;
  rationale: string;
  /** AI rubric-assist suggestion at decision time, if any. */
  aiSuggestedDecision?: MentorDecision;
  aiInvocationId?: string;
}

/**
 * Mentor makes a decision on the submission they hold:
 *   - 'accept'              → status='accepted', decidedAt=now
 *   - 'reject'              → status='rejected', decidedAt=now
 *   - 'feedback_requested'  → status='feedback_requested', decidedAt=now
 *                             (contributor can edit + resubmit; reviewerId
 *                             remains so the same mentor sees the resubmit)
 *
 * Captures the AI suggestion when present so the system can later
 * compute the override rate (criterion #19's audit trail).
 */
export async function decideSubmission(
  tx: Tx,
  args: {
    submissionId: string;
    reviewerId: string;
    input: DecideSubmissionInput;
  },
): Promise<
  SubmissionDetail & {
    aiOverride: boolean;
    payout: PayoutDetail | null;
    credential: CredentialDetail | null;
  }
> {
  const { submissionId, reviewerId, input } = args;
  const sub = await tx.submission.findFirst({
    where: { id: submissionId, deletedAt: null },
  });
  if (!sub) throw new SubmissionServiceError("Submission not found", "not_found");
  if (sub.reviewerId !== reviewerId) {
    throw new SubmissionServiceError(
      "Only the current claimant can decide",
      "forbidden",
    );
  }
  if (sub.status !== "under_review") {
    throw new SubmissionServiceError(
      `Cannot decide a submission in '${sub.status}' state — claim it first`,
      "invalid_state",
    );
  }
  if (!input.rationale.trim()) {
    throw new SubmissionServiceError(
      "A rationale is required for any mentor decision",
      "validation",
    );
  }

  const nextStatus: SubmissionStatus =
    input.decision === "accept"
      ? "accepted"
      : input.decision === "reject"
        ? "rejected"
        : "feedback_requested";

  const now = new Date();
  await tx.submission.update({
    where: { id: sub.id },
    data: {
      status: nextStatus,
      decidedAt: now,
      decisionRationale: input.rationale,
      aiSuggestedDecision: input.aiSuggestedDecision ?? null,
      aiInvocationId: input.aiInvocationId ?? null,
      ...(nextStatus === "feedback_requested"
        ? {}
        : { reviewerId: null, reviewerAssignedAt: null }),
    },
  });

  let payout: PayoutDetail | null = null;
  let credential: CredentialDetail | null = null;
  if (nextStatus === "accepted") {
    const taskRow = await tx.taskDefinition.findFirst({
      where: { id: sub.taskDefinitionId },
      select: { reviewPath: true },
    });
    const skipPayout = isInternalReviewPath(taskRow?.reviewPath ?? null);

    // Cascade task → accepted, then create payout + credential rows
    // in the same transaction so eligibility + issuance are atomic
    // with the mentor's decision.
    const task = await tx.taskDefinition.update({
      where: { id: sub.taskDefinitionId },
      data: { status: "accepted" },
      select: {
        id: true,
        title: true,
        externalKey: true,
        requiredSkills: true,
        estimatedHours: true,
        agreedRatePerHour: true,
        agreedCurrency: true,
      },
    });
    if (task.estimatedHours != null && task.estimatedHours > 0 && !skipPayout) {
      payout = await markPayoutEligibleOnAcceptance(tx, {
        submissionId: sub.id,
        taskDefinitionId: task.id,
        contributorId: sub.contributorId,
        tenantId: sub.tenantId,
        estimatedHours: task.estimatedHours,
        agreedRatePerHour: task.agreedRatePerHour,
        agreedCurrency: task.agreedCurrency,
      });
    }
    // Credential issuance — independent of payout. A credential is
    // a record of "did the work", and we want it even if rate wasn't
    // set on the task.
    const contributor = await tx.user.findUnique({
      where: { id: sub.contributorId },
      select: { firstName: true, lastName: true },
    });
    const tenant = await tx.tenant.findUnique({
      where: { id: sub.tenantId },
      select: { name: true },
    });
    credential = await issueCredentialOnAcceptance(tx, {
      submissionId: sub.id,
      taskDefinitionId: task.id,
      contributorId: sub.contributorId,
      contributorName: contributor
        ? `${contributor.firstName} ${contributor.lastName}`.trim()
        : "Contributor",
      tenantId: sub.tenantId,
      tenantName: tenant?.name ?? "Tenant",
      taskTitle: task.title,
      taskExternalKey: task.externalKey,
      skills: task.requiredSkills,
      acceptedAt: now,
      mentorReviewedBy: reviewerId,
    });
    // M19: notify enterprise reviewers in the tenant so they see the
    // submission in their queue. Best-effort — failures don't roll back
    // the mentor's accept (which has already produced the payout +
    // credential rows in this same tx).
    try {
      await notifyEnterpriseReviewersOnMentorAccept(tx, {
        submissionId: sub.id,
        taskId: task.id,
        taskTitle: task.title,
        tenantId: sub.tenantId,
        actor: SYSTEM_ACTOR,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[decideSubmission] enterprise-reviewer notify failed", err);
    }
  } else if (nextStatus === "rejected") {
    await tx.taskDefinition.update({
      where: { id: sub.taskDefinitionId },
      data: { status: "reviewed" },
    });
  }

  const aiOverride =
    input.aiSuggestedDecision !== undefined &&
    input.aiSuggestedDecision !== input.decision;

  const detail = toDetail(await reload(tx, sub.id));
  return { ...detail, aiOverride, payout, credential };
}
