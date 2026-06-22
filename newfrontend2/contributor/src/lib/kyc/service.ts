/**
 * KYC service (M23).
 *
 *   submitKycCheck — contributor uploads docs → status='submitted'
 *   claimKycCheck — compliance/T&S/admin claims for review
 *   releaseKycClaim — release the claim
 *   decideKyc — terminal (approved/rejected) or hold (needs more info)
 *   listKycQueue — review queue surface
 *   listKycForContributor / getActiveKycForContributor — contributor self-view
 *
 * Notifications:
 *   - On submit: fan-out to compliance/T&S team
 *   - On approved: kyc.approved (contributor)
 *   - On rejected: kyc.rejected (contributor)
 *   - On hold:    kyc.rejected kind reused (no separate "hold" kind in
 *                 M6 catalog; the body distinguishes "needs more info")
 */

import { Prisma } from "@/generated/prisma/client";
import { dispatchNotification } from "@/lib/notifications";
import type { AuditActor } from "@/lib/audit";
import type {
  DecideKycInput,
  KycCheckDetail,
  KycDecision,
  KycDocumentRef,
  KycStatus,
  SubmitKycInput,
} from "./types";

type Tx = Prisma.TransactionClient;

export class KycServiceError extends Error {
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
    this.name = "KycServiceError";
  }
}

/* ───────────────────────── Mappers ───────────────────────── */

function toIso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

function toDetail(row: {
  id: string;
  contributorId: string;
  status: string;
  documents: Prisma.JsonValue;
  riskScore: number | null;
  assigneeId: string | null;
  assignedAt: Date | null;
  submittedAt: Date | null;
  decidedAt: Date | null;
  decidedBy: string | null;
  decisionReason: string | null;
  heldAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): KycCheckDetail {
  return {
    id: row.id,
    contributorId: row.contributorId,
    status: row.status as KycStatus,
    documents: (row.documents ?? []) as unknown as KycDocumentRef[],
    riskScore: row.riskScore,
    assigneeId: row.assigneeId,
    assignedAt: toIso(row.assignedAt),
    submittedAt: toIso(row.submittedAt),
    decidedAt: toIso(row.decidedAt),
    decidedBy: row.decidedBy,
    decisionReason: row.decisionReason,
    heldAt: toIso(row.heldAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/* ───────────────────────── Validation ───────────────────────── */

const DOC_KINDS = ["id_card", "address_proof", "pan", "passport", "other"];

function validateDocuments(docs: KycDocumentRef[]) {
  if (!Array.isArray(docs) || docs.length === 0) {
    throw new KycServiceError("At least one document is required", "validation");
  }
  if (docs.length > 10) {
    throw new KycServiceError(
      "Too many documents (max 10 per submission)",
      "validation",
    );
  }
  for (const d of docs) {
    if (!d.kind || !DOC_KINDS.includes(d.kind)) {
      throw new KycServiceError(
        `Invalid document kind '${String(d.kind)}'`,
        "validation",
      );
    }
    if (!d.name?.trim()) {
      throw new KycServiceError("Document name required", "validation");
    }
    if (!d.url?.trim()) {
      throw new KycServiceError("Document url required", "validation");
    }
  }
}

/* ───────────────────────── Reads ───────────────────────── */

export async function getActiveKycForContributor(
  tx: Tx,
  contributorUserId: string,
): Promise<KycCheckDetail | null> {
  const row = await tx.kycCheck.findFirst({
    where: {
      contributorId: contributorUserId,
      deletedAt: null,
      status: { in: ["pending", "submitted", "under_review", "hold"] },
    },
    orderBy: { createdAt: "desc" },
  });
  return row ? toDetail(row) : null;
}

export async function getLatestKycForContributor(
  tx: Tx,
  contributorUserId: string,
): Promise<KycCheckDetail | null> {
  const row = await tx.kycCheck.findFirst({
    where: { contributorId: contributorUserId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return row ? toDetail(row) : null;
}

export async function listKycForContributor(
  tx: Tx,
  contributorUserId: string,
): Promise<KycCheckDetail[]> {
  const rows = await tx.kycCheck.findMany({
    where: { contributorId: contributorUserId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toDetail);
}

export interface ListQueueOptions {
  assigneeId?: string;
  unclaimedOnly?: boolean;
  statuses?: KycStatus[];
  limit?: number;
}

export async function listKycQueue(
  tx: Tx,
  options: ListQueueOptions = {},
): Promise<KycCheckDetail[]> {
  const where: Prisma.KycCheckWhereInput = {
    deletedAt: null,
    ...(options.assigneeId ? { assigneeId: options.assigneeId } : {}),
    ...(options.unclaimedOnly ? { assigneeId: null } : {}),
    ...(options.statuses && options.statuses.length > 0
      ? { status: { in: options.statuses } }
      : { status: { in: ["submitted", "under_review"] } }),
  };
  const rows = await tx.kycCheck.findMany({
    where,
    orderBy: { submittedAt: "asc" },
    take: options.limit ?? 50,
  });
  return rows.map(toDetail);
}

/* ───────────────────────── Writes ───────────────────────── */

/**
 * Submit KYC documents. Behavior:
 *   - If contributor has no in-flight row → create a new row with status='submitted'
 *   - If they have a 'hold' row → resubmit (replace documents, status → 'submitted', heldAt → null)
 *   - If they have a 'pending'/'submitted'/'under_review' row → conflict
 *
 * Reviewer fan-out happens here (notifies compliance/T&S team).
 */
export async function submitKycCheck(
  tx: Tx,
  args: {
    contributorUserId: string;
    input: SubmitKycInput;
    actor: AuditActor;
  },
): Promise<KycCheckDetail> {
  validateDocuments(args.input.documents);

  // Find any active row
  const active = await tx.kycCheck.findFirst({
    where: {
      contributorId: args.contributorUserId,
      deletedAt: null,
      status: { in: ["pending", "submitted", "under_review", "hold"] },
    },
    orderBy: { createdAt: "desc" },
  });

  let row;
  if (active && active.status === "hold") {
    // Resubmit on the same row
    row = await tx.kycCheck.update({
      where: { id: active.id },
      data: {
        status: "submitted",
        documents: args.input.documents as unknown as Prisma.InputJsonValue,
        submittedAt: new Date(),
        heldAt: null,
        decidedAt: null,
        decidedBy: null,
        decisionReason: null,
        assigneeId: null,
        assignedAt: null,
      },
    });
  } else if (active) {
    throw new KycServiceError(
      `Cannot submit — an in-flight KYC check exists in '${active.status}' state`,
      "conflict",
    );
  } else {
    row = await tx.kycCheck.create({
      data: {
        contributorId: args.contributorUserId,
        status: "submitted",
        documents: args.input.documents as unknown as Prisma.InputJsonValue,
        submittedAt: new Date(),
      },
    });
  }

  // Fan-out to reviewers
  const reviewers = await findKycReviewers(tx);
  for (const recipientUserId of reviewers) {
    try {
      await dispatchNotification(
        {
          recipientUserId,
          tenantId: null,
          kind: "kyc.approved", // no kyc.submitted kind; reusing approved/rejected categories — use approved for "new in queue" to avoid criticality
          severity: "important",
          title: "New KYC check awaiting review",
          body: `Contributor submitted ${args.input.documents.length} document(s) for verification.`,
          actionUrl: `/admin/kyc/${row.id}`,
          actionLabel: "Open KYC review",
          resourceType: "kyc_check",
          resourceId: row.id,
        },
        { tx, actor: args.actor },
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[submitKycCheck] reviewer dispatch failed", err);
    }
  }

  return toDetail(row);
}

async function loadCheck(tx: Tx, id: string) {
  const r = await tx.kycCheck.findFirst({
    where: { id, deletedAt: null },
  });
  if (!r) throw new KycServiceError("KYC check not found", "not_found");
  return r;
}

export async function claimKycCheck(
  tx: Tx,
  args: { kycId: string; assigneeUserId: string },
): Promise<KycCheckDetail> {
  const r = await loadCheck(tx, args.kycId);
  if (r.status !== "submitted" && r.status !== "under_review") {
    throw new KycServiceError(
      `Cannot claim a KYC check in '${r.status}' state`,
      "invalid_state",
    );
  }
  if (r.assigneeId && r.assigneeId !== args.assigneeUserId) {
    throw new KycServiceError(
      "Already claimed by another reviewer",
      "conflict",
    );
  }
  const updated = await tx.kycCheck.update({
    where: { id: r.id },
    data: {
      status: "under_review",
      assigneeId: args.assigneeUserId,
      assignedAt:
        r.assigneeId === args.assigneeUserId && r.assignedAt
          ? r.assignedAt
          : new Date(),
    },
  });
  return toDetail(updated);
}

export async function releaseKycClaim(
  tx: Tx,
  args: { kycId: string; assigneeUserId: string },
): Promise<KycCheckDetail> {
  const r = await loadCheck(tx, args.kycId);
  if (r.assigneeId !== args.assigneeUserId) {
    throw new KycServiceError(
      "Only the current assignee can release",
      "forbidden",
    );
  }
  if (r.status !== "under_review") {
    throw new KycServiceError(
      `Cannot release a KYC check in '${r.status}' state`,
      "invalid_state",
    );
  }
  const updated = await tx.kycCheck.update({
    where: { id: r.id },
    data: {
      status: "submitted",
      assigneeId: null,
      assignedAt: null,
    },
  });
  return toDetail(updated);
}

export async function decideKyc(
  tx: Tx,
  args: {
    kycId: string;
    assigneeUserId: string;
    input: DecideKycInput;
    actor: AuditActor;
  },
): Promise<KycCheckDetail> {
  const r = await loadCheck(tx, args.kycId);
  if (r.assigneeId !== args.assigneeUserId) {
    throw new KycServiceError(
      "Only the current assignee can decide",
      "forbidden",
    );
  }
  if (r.status !== "under_review") {
    throw new KycServiceError(
      `Cannot decide a KYC check in '${r.status}' state — claim it first`,
      "invalid_state",
    );
  }
  const decision: KycDecision = args.input.decision;
  if (
    (decision === "rejected" || decision === "hold") &&
    !args.input.reason?.trim()
  ) {
    throw new KycServiceError(
      `Decision '${decision}' requires a reason`,
      "validation",
    );
  }

  const now = new Date();
  let nextStatus: KycStatus;
  if (decision === "approved") nextStatus = "approved";
  else if (decision === "rejected") nextStatus = "rejected";
  else nextStatus = "hold";

  const updated = await tx.kycCheck.update({
    where: { id: r.id },
    data: {
      status: nextStatus,
      decidedAt: nextStatus === "hold" ? null : now,
      decidedBy: nextStatus === "hold" ? null : args.assigneeUserId,
      decisionReason: args.input.reason ?? null,
      heldAt: nextStatus === "hold" ? now : null,
      // Clear the claim on terminal; keep it on hold (so the same
      // reviewer sees the resubmit when it comes back).
      ...(nextStatus === "approved" || nextStatus === "rejected"
        ? { assigneeId: null, assignedAt: null }
        : {}),
    },
  });

  // Notify the contributor of the outcome
  try {
    const notifKind =
      nextStatus === "approved"
        ? "kyc.approved"
        : "kyc.rejected"; // also used for 'hold' since there's no kyc.hold kind in M6 catalog
    const title =
      nextStatus === "approved"
        ? "KYC approved"
        : nextStatus === "rejected"
          ? "KYC rejected"
          : "More information needed for KYC";
    const body =
      nextStatus === "approved"
        ? args.input.reason ?? "Your verification is complete. Payouts are now enabled."
        : args.input.reason ?? "Please review the feedback and resubmit your documents.";
    await dispatchNotification(
      {
        recipientUserId: r.contributorId,
        tenantId: null,
        kind: notifKind,
        severity: "important",
        title,
        body,
        actionUrl: `/contributor/profile/kyc`,
        actionLabel: "View KYC status",
        resourceType: "kyc_check",
        resourceId: r.id,
      },
      { tx, actor: args.actor },
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[decideKyc] contributor notify failed", err);
  }

  return toDetail(updated);
}

/* ───────────────────────── Reviewer discovery ───────────────── */

export async function findKycReviewers(tx: Tx): Promise<string[]> {
  const rows = await tx.userRole.findMany({
    where: {
      role: {
        rolePermissions: { some: { permissionCode: "decide.kyc" } },
      },
    },
    select: { userId: true },
    distinct: ["userId"],
  });
  return rows.map((r) => r.userId);
}
