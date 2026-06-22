/**
 * Enterprise-review service (M19).
 *
 * Flow:
 *   1. Mentor accepts (M16) → submission.status='accepted'
 *   2. M19 notifyEnterpriseReviewersOnMentorAccept (called from M16 decide)
 *      fans out notifications to ent.reviewer/admin/sponsor users in the tenant
 *   3. Reviewer claims (this service) → enterpriseReviewerId set
 *   4. Reviewer decides accept or rework
 *      - accept: AcceptanceDecision row + submission.enterpriseDecidedAt
 *        + contributor notification + payout-disbursement trigger placeholder
 *      - rework: AcceptanceDecision row + submission flips to
 *        'feedback_requested' so the contributor can edit + resubmit
 *
 * RLS: Submission is tenant-scoped (M15 RLS), so all reads/writes go
 * through `ctx.withTx` with `app.tenant_id` set.
 */

import { Prisma } from "@/generated/prisma/client";
import { dispatchNotification } from "@/lib/notifications";
import type { AuditActor } from "@/lib/audit";
import { recordInternalCostAccrualOnAcceptance } from "@/lib/payouts/internal-accrual";
import { markPayoutEligibleOnAcceptance } from "@/lib/payouts/service";
import { issueCredentialOnAcceptance } from "@/lib/credentials/service";
import { isInternalReviewPath } from "@/lib/workforce/policies";
import type {
  EnterpriseDecision,
  EnterpriseDecisionResult,
  EnterpriseReviewQueueItem,
} from "./types";

type Tx = Prisma.TransactionClient;

export class EnterpriseReviewError extends Error {
  constructor(
    message: string,
    public code: "not_found" | "forbidden" | "invalid_state" | "validation" | "conflict",
  ) {
    super(message);
    this.name = "EnterpriseReviewError";
  }
}

/* ─────────────────────── Queue listing ─────────────────────── */

export interface ListQueueOptions {
  tenantId: string;
  /** When set, returns only submissions claimed by this reviewer. */
  reviewerId?: string;
  /** When true (default), includes only unclaimed submissions in the queue. */
  unclaimedOnly?: boolean;
  limit?: number;
}

export async function listEnterpriseReviewQueue(
  tx: Tx,
  options: ListQueueOptions,
): Promise<EnterpriseReviewQueueItem[]> {
  const where: Prisma.SubmissionWhereInput = {
    tenantId: options.tenantId,
    deletedAt: null,
    // Mentor signed off → status='accepted'. Enterprise decision pending
    // is encoded as enterpriseDecidedAt being null.
    status: "accepted",
    enterpriseDecidedAt: null,
    ...(options.reviewerId
      ? { enterpriseReviewerId: options.reviewerId }
      : options.unclaimedOnly === false
        ? {}
        : { enterpriseReviewerId: null }),
  };

  const rows = await tx.submission.findMany({
    where,
    orderBy: [{ decidedAt: "asc" }, { submittedAt: "asc" }],
    take: options.limit ?? 50,
    include: {
      taskDefinition: { select: { title: true } },
      contributor: { select: { firstName: true, lastName: true } },
      _count: { select: { artifacts: true } },
    },
  });

  return rows.map(mapSubmissionToQueueItem);
}

function mapSubmissionToQueueItem(r: {
  id: string;
  taskDefinitionId: string;
  contributorId: string;
  version: number;
  decidedAt: Date | null;
  updatedAt: Date;
  reviewerId: string | null;
  enterpriseReviewerId: string | null;
  enterpriseReviewerAssignedAt: Date | null;
  taskDefinition: { title: string };
  contributor: { firstName: string; lastName: string };
  _count: { artifacts: number };
}): EnterpriseReviewQueueItem {
  return {
    submissionId: r.id,
    taskDefinitionId: r.taskDefinitionId,
    taskTitle: r.taskDefinition.title,
    contributorId: r.contributorId,
    contributorName: `${r.contributor.firstName} ${r.contributor.lastName}`.trim(),
    version: r.version,
    acceptedAt: (r.decidedAt ?? r.updatedAt).toISOString(),
    mentorReviewerId: r.reviewerId,
    enterpriseReviewerId: r.enterpriseReviewerId,
    enterpriseReviewerAssignedAt:
      r.enterpriseReviewerAssignedAt?.toISOString() ?? null,
    artifactCount: r._count.artifacts,
  };
}

export interface EnterpriseReviewHistoryItem extends EnterpriseReviewQueueItem {
  decision: EnterpriseDecision;
  decidedAt: string;
  decisionId: string;
  note?: string | null;
}

export async function getEnterpriseReviewSubmission(
  tx: Tx,
  args: { submissionId: string; tenantId: string },
): Promise<{ item: EnterpriseReviewQueueItem; decided: EnterpriseReviewHistoryItem | null } | null> {
  const row = await tx.submission.findFirst({
    where: {
      id: args.submissionId,
      tenantId: args.tenantId,
      deletedAt: null,
    },
    include: {
      taskDefinition: { select: { title: true } },
      contributor: { select: { firstName: true, lastName: true } },
      _count: { select: { artifacts: true } },
      enterpriseDecisions: {
        orderBy: { decidedAt: "desc" },
        take: 1,
      },
    },
  });
  if (!row) return null;

  const item = mapSubmissionToQueueItem(row);
  const latest = row.enterpriseDecisions[0];

  if (row.enterpriseDecidedAt && latest) {
    return {
      item,
      decided: {
        ...item,
        decision: latest.decision as EnterpriseDecision,
        decidedAt: latest.decidedAt.toISOString(),
        decisionId: latest.id,
        note: latest.note,
      },
    };
  }

  if (row.status === "accepted" && !row.enterpriseDecidedAt) {
    return { item, decided: null };
  }

  return null;
}

/* ─────────────────────── Claim / Release ─────────────────────── */

export async function claimSubmissionForEnterpriseReview(
  tx: Tx,
  args: { submissionId: string; reviewerId: string },
): Promise<EnterpriseReviewQueueItem> {
  const sub = await tx.submission.findFirst({
    where: { id: args.submissionId, deletedAt: null },
  });
  if (!sub) throw new EnterpriseReviewError("Submission not found", "not_found");
  if (sub.status !== "accepted") {
    throw new EnterpriseReviewError(
      `Cannot claim a submission in '${sub.status}' state — mentor must accept first`,
      "invalid_state",
    );
  }
  if (sub.enterpriseDecidedAt) {
    throw new EnterpriseReviewError(
      "Submission already has a terminal enterprise decision",
      "invalid_state",
    );
  }
  if (sub.enterpriseReviewerId && sub.enterpriseReviewerId !== args.reviewerId) {
    throw new EnterpriseReviewError(
      "Already claimed by another enterprise reviewer",
      "conflict",
    );
  }

  await tx.submission.update({
    where: { id: sub.id },
    data: {
      enterpriseReviewerId: args.reviewerId,
      enterpriseReviewerAssignedAt:
        sub.enterpriseReviewerId === args.reviewerId &&
        sub.enterpriseReviewerAssignedAt
          ? sub.enterpriseReviewerAssignedAt
          : new Date(),
    },
  });

  const items = await listEnterpriseReviewQueue(tx, {
    tenantId: sub.tenantId,
    reviewerId: args.reviewerId,
    unclaimedOnly: false,
    limit: 1,
  });
  // Filter by submissionId since listQueue returns multiple
  const match = items.find((i) => i.submissionId === sub.id);
  if (!match) {
    throw new EnterpriseReviewError("Submission vanished after claim", "not_found");
  }
  return match;
}

export async function releaseEnterpriseReviewClaim(
  tx: Tx,
  args: { submissionId: string; reviewerId: string },
): Promise<void> {
  const sub = await tx.submission.findFirst({
    where: { id: args.submissionId, deletedAt: null },
  });
  if (!sub) throw new EnterpriseReviewError("Submission not found", "not_found");
  if (sub.enterpriseReviewerId !== args.reviewerId) {
    throw new EnterpriseReviewError(
      "Only the current claimant can release",
      "forbidden",
    );
  }
  if (sub.enterpriseDecidedAt) {
    throw new EnterpriseReviewError(
      "Cannot release after a terminal decision",
      "invalid_state",
    );
  }
  await tx.submission.update({
    where: { id: sub.id },
    data: {
      enterpriseReviewerId: null,
      enterpriseReviewerAssignedAt: null,
    },
  });
}

/* ─────────────────────── Decision ─────────────────────── */

export interface RecordDecisionInput {
  submissionId: string;
  reviewerId: string;
  decision: EnterpriseDecision;
  /** Required for rework; optional for accept. */
  note?: string;
  /** Display initials for backwards compatibility with the legacy
   *  AcceptanceDecision schema. */
  deciderInitials?: string;
}

/**
 * Record the final enterprise decision. Writes the AcceptanceDecision
 * row + updates Submission. For 'rework', flips submission status back
 * to 'feedback_requested' so the contributor can edit + resubmit.
 *
 * Caller is responsible for permission check (decide.enterprise_review).
 * Returns the new AcceptanceDecision id + decidedAt for audit linkage.
 */
export async function recordEnterpriseDecision(
  tx: Tx,
  args: RecordDecisionInput,
): Promise<EnterpriseDecisionResult> {
  const sub = await tx.submission.findFirst({
    where: { id: args.submissionId, deletedAt: null },
  });
  if (!sub) throw new EnterpriseReviewError("Submission not found", "not_found");
  if (sub.enterpriseReviewerId !== args.reviewerId) {
    throw new EnterpriseReviewError(
      "Only the current claimant can decide",
      "forbidden",
    );
  }
  if (sub.status !== "accepted") {
    throw new EnterpriseReviewError(
      `Cannot decide on a submission in '${sub.status}' state`,
      "invalid_state",
    );
  }
  if (sub.enterpriseDecidedAt) {
    throw new EnterpriseReviewError(
      "Submission already has a terminal enterprise decision",
      "invalid_state",
    );
  }
  if (args.decision === "rework" && !args.note?.trim()) {
    throw new EnterpriseReviewError(
      "Rework decision requires a note explaining what needs to change",
      "validation",
    );
  }

  const now = new Date();

  const decisionRow = await tx.acceptanceDecision.create({
    data: {
      taskId: sub.taskDefinitionId,
      submissionId: sub.id,
      decision: args.decision,
      note: args.note ?? null,
      deciderId: args.reviewerId,
      deciderInitials: args.deciderInitials ?? null,
      tenantId: sub.tenantId,
    },
    select: { id: true, decidedAt: true },
  });

  if (args.decision === "accept") {
    const task = await tx.taskDefinition.findFirst({
      where: { id: sub.taskDefinitionId },
      select: {
        reviewPath: true,
        estimatedHours: true,
        agreedRatePerHour: true,
        agreedCurrency: true,
        title: true,
        externalKey: true,
        requiredSkills: true,
      },
    });

    // Submission stays at status='accepted'; enterpriseDecidedAt marks
    // final acceptance. Reviewer claim is cleared so the row drops out
    // of the queue.
    await tx.submission.update({
      where: { id: sub.id },
      data: {
        enterpriseDecidedAt: now,
        enterpriseReviewerId: null,
        enterpriseReviewerAssignedAt: null,
      },
    });

    await tx.taskDefinition.update({
      where: { id: sub.taskDefinitionId },
      data: { status: "accepted" },
    });

    // THIS is the single point where money + credentials are committed —
    // only after enterprise sign-off, never at the mentor (quality) gate.
    // A rework/reject above never reaches here, so un-accepted work is never
    // paid or credentialed. Both helpers are idempotent.
    if (task && isInternalReviewPath(task.reviewPath)) {
      await recordInternalCostAccrualOnAcceptance(tx, {
        submissionId: sub.id,
        taskDefinitionId: sub.taskDefinitionId,
        tenantId: sub.tenantId,
        estimatedHours: task.estimatedHours,
        agreedRatePerHour: task.agreedRatePerHour,
        agreedCurrency: task.agreedCurrency,
      });
    } else if (task) {
      if (task.estimatedHours != null && task.estimatedHours > 0) {
        await markPayoutEligibleOnAcceptance(tx, {
          submissionId: sub.id,
          taskDefinitionId: sub.taskDefinitionId,
          contributorId: sub.contributorId,
          tenantId: sub.tenantId,
          estimatedHours: task.estimatedHours,
          agreedRatePerHour: task.agreedRatePerHour,
          agreedCurrency: task.agreedCurrency,
        });
      }
      const contributor = await tx.user.findUnique({
        where: { id: sub.contributorId },
        select: { firstName: true, lastName: true },
      });
      const tenant = await tx.tenant.findUnique({
        where: { id: sub.tenantId },
        select: { name: true },
      });
      await issueCredentialOnAcceptance(tx, {
        submissionId: sub.id,
        taskDefinitionId: sub.taskDefinitionId,
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
      });
    }
  } else {
    // Rework: send back to the contributor via the normal feedback loop.
    // submission status reverts; mentor's prior accept is preserved on
    // the row but the contributor edits + resubmits.
    await tx.submission.update({
      where: { id: sub.id },
      data: {
        status: "feedback_requested",
        enterpriseDecidedAt: now,
        enterpriseReviewerId: null,
        enterpriseReviewerAssignedAt: null,
      },
    });
    // Roll the task definition back so it shows as "in_progress" again
    // for the contributor's task feed.
    await tx.taskDefinition.update({
      where: { id: sub.taskDefinitionId },
      data: { status: "in_progress" },
    });
  }

  return {
    submissionId: sub.id,
    decision: args.decision,
    decisionId: decisionRow.id,
    decidedAt: decisionRow.decidedAt.toISOString(),
  };
}

/* ───────────── Reviewer fan-out on mentor accept ───────────── */

/**
 * Find every userId in the tenant who can decide enterprise reviews.
 * Used by the M16 mentor-accept hook to notify the right people.
 */
export async function findEnterpriseReviewers(
  tx: Tx,
  tenantId: string,
): Promise<string[]> {
  const rows = await tx.userRole.findMany({
    where: {
      OR: [{ tenantId }, { tenantId: null }],
      role: {
        rolePermissions: {
          some: { permissionCode: "decide.enterprise_review" },
        },
      },
      user: { tenantId, role: "enterprise" },
    },
    select: { userId: true },
    distinct: ["userId"],
  });
  return rows.map((r) => r.userId);
}

/**
 * Called from the M16 mentor-accept flow inside the same transaction.
 * Fan-outs a `task.accepted` notification (kind reused from M6 catalog)
 * to enterprise reviewers in the tenant. Best-effort — failures here
 * MUST NOT roll back the mentor's accept; the caller wraps in try/catch
 * and logs.
 */
export async function notifyEnterpriseReviewersOnMentorAccept(
  tx: Tx,
  args: {
    submissionId: string;
    taskId: string;
    taskTitle: string;
    tenantId: string;
    actor: AuditActor;
  },
): Promise<{ recipientCount: number; failures: string[] }> {
  const reviewerIds = await findEnterpriseReviewers(tx, args.tenantId);
  const failures: string[] = [];

  for (const recipientUserId of reviewerIds) {
    try {
      await dispatchNotification(
        {
          recipientUserId,
          tenantId: args.tenantId,
          kind: "task.accepted",
          severity: "important",
          title: `Ready for your final review — ${args.taskTitle}`,
          body: `A mentor accepted this submission and it now needs your business sign-off.`,
          actionUrl: `/enterprise/review/${args.submissionId}`,
          actionLabel: "Open acceptance queue",
          resourceType: "submission",
          resourceId: args.submissionId,
        },
        { tx, actor: args.actor },
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        `[notifyEnterpriseReviewersOnMentorAccept] dispatch failed for ${recipientUserId}`,
        err,
      );
      failures.push(recipientUserId);
    }
  }

  return { recipientCount: reviewerIds.length, failures };
}

/**
 * Internal review path: contributor submit skips mentor and lands
 * directly in the enterprise acceptance queue.
 */
export async function notifyEnterpriseReviewersOnInternalSubmit(
  tx: Tx,
  args: {
    submissionId: string;
    taskId: string;
    taskTitle: string;
    tenantId: string;
    actor: AuditActor;
  },
): Promise<{ recipientCount: number; failures: string[] }> {
  const reviewerIds = await findEnterpriseReviewers(tx, args.tenantId);
  const failures: string[] = [];

  for (const recipientUserId of reviewerIds) {
    try {
      await dispatchNotification(
        {
          recipientUserId,
          tenantId: args.tenantId,
          kind: "task.accepted",
          severity: "important",
          title: `Internal delivery ready for review — ${args.taskTitle}`,
          body: `An internal contributor submitted work that needs your sign-off (no mentor stage).`,
          actionUrl: `/enterprise/review/${args.submissionId}`,
          actionLabel: "Open acceptance queue",
          resourceType: "submission",
          resourceId: args.submissionId,
        },
        { tx, actor: args.actor },
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        `[notifyEnterpriseReviewersOnInternalSubmit] dispatch failed for ${recipientUserId}`,
        err,
      );
      failures.push(recipientUserId);
    }
  }

  return { recipientCount: reviewerIds.length, failures };
}
