/**
 * SOW service — server-side functions for the SOW lifecycle. Each
 * function is meant to be called from inside a `ctx.withTx` block so
 * that RLS scope (app.tenant_id) is set on the transaction.
 *
 * Phase 1 covers draft CRUD + submit/withdraw/archive. Per-stage
 * approve/reject/send-back lands in M9b.
 *
 * Versioning rule: `update` creates a new SowVersion row whenever the
 * payload OR body changes. The Sow.activeVersion counter advances.
 * Title / confidentiality changes don't bump the version — they're
 * metadata edits that the wizard saves on the same draft.
 */

import { Prisma } from "@/generated/prisma/client";
import { APPROVAL_STAGE_ORDER } from "./types";
import type {
  CreateSowInput,
  SowApprovalSummary,
  SowConfidentiality,
  SowDetail,
  SowStage,
  SowStatus,
  SowSummary,
  SowVersionDetail,
  UpdateSowDraftInput,
} from "./types";

type Tx = Prisma.TransactionClient;

/* ──────────────────────── Internal helpers ──────────────────────── */

function toIso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

function toSummary(row: {
  id: string;
  title: string;
  status: string;
  stage: string | null;
  activeVersion: number;
  ownerId: string;
  confidentiality: string;
  submittedForApprovalAt: Date | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  withdrawnAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): SowSummary {
  return {
    id: row.id,
    title: row.title,
    status: row.status as SowStatus,
    stage: row.stage as SowStage | null,
    activeVersion: row.activeVersion,
    ownerId: row.ownerId,
    confidentiality: row.confidentiality as SowConfidentiality,
    submittedForApprovalAt: toIso(row.submittedForApprovalAt),
    approvedAt: toIso(row.approvedAt),
    rejectedAt: toIso(row.rejectedAt),
    withdrawnAt: toIso(row.withdrawnAt),
    archivedAt: toIso(row.archivedAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toVersionDetail(row: {
  version: number;
  payload: Prisma.JsonValue;
  body: string | null;
  changeNote: string | null;
  createdBy: string;
  createdAt: Date;
}): SowVersionDetail {
  return {
    version: row.version,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    body: row.body,
    changeNote: row.changeNote,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
  };
}

function toApprovalSummary(row: {
  id: string;
  stage: string;
  sowVersion: number;
  approverId: string | null;
  decision: string;
  comment: string | null;
  decidedAt: Date | null;
  slaDeadline: Date | null;
  createdAt: Date;
}): SowApprovalSummary {
  return {
    id: row.id,
    stage: row.stage as SowStage,
    sowVersion: row.sowVersion,
    approverId: row.approverId,
    decision: row.decision as SowApprovalSummary["decision"],
    comment: row.comment,
    decidedAt: toIso(row.decidedAt),
    slaDeadline: toIso(row.slaDeadline),
    createdAt: row.createdAt.toISOString(),
  };
}

export class SowServiceError extends Error {
  constructor(
    message: string,
    public code:
      | "not_found"
      | "invalid_state"
      | "forbidden"
      | "validation"
      | "conflict",
  ) {
    super(message);
    this.name = "SowServiceError";
  }
}

/* ──────────────────────────── Reads ──────────────────────────── */

export interface ListSowsOptions {
  tenantId: string;
  status?: SowStatus | SowStatus[];
  stage?: SowStage;
  ownerId?: string;
  /** Default: false — archived rows are hidden. */
  includeArchived?: boolean;
  limit?: number;
  cursor?: string;
}

export async function listSows(
  tx: Tx,
  options: ListSowsOptions,
): Promise<{ items: SowSummary[]; nextCursor: string | null }> {
  const limit = Math.min(options.limit ?? 50, 100);
  const statusFilter = options.status
    ? Array.isArray(options.status)
      ? { in: options.status }
      : options.status
    : options.includeArchived
      ? undefined
      : { not: "archived" };

  const rows = await tx.sow.findMany({
    where: {
      tenantId: options.tenantId,
      deletedAt: null,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(options.stage ? { stage: options.stage } : {}),
      ...(options.ownerId ? { ownerId: options.ownerId } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: limit + 1,
    ...(options.cursor
      ? { cursor: { id: options.cursor }, skip: 1 }
      : {}),
  });

  const hasMore = rows.length > limit;
  const items = (hasMore ? rows.slice(0, limit) : rows).map(toSummary);
  const nextCursor = hasMore ? rows[limit - 1].id : null;
  return { items, nextCursor };
}

export async function getSowDetail(
  tx: Tx,
  sowId: string,
): Promise<SowDetail | null> {
  const sow = await tx.sow.findFirst({
    where: { id: sowId, deletedAt: null },
  });
  if (!sow) return null;

  const [activeVersion, approvals] = await Promise.all([
    tx.sowVersion.findFirst({
      where: { sowId: sow.id, version: sow.activeVersion },
    }),
    tx.approval.findMany({
      where: { sowId: sow.id },
      orderBy: [{ createdAt: "asc" }],
    }),
  ]);

  return {
    ...toSummary(sow),
    activeVersionDetail: activeVersion ? toVersionDetail(activeVersion) : null,
    approvals: approvals.map(toApprovalSummary),
  };
}

/* ──────────────────────────── Writes ──────────────────────────── */

/**
 * Create a new SOW in draft state with version 1. The caller is the
 * owner. Returns the freshly created SOW + its v1 snapshot.
 */
export async function createSowDraft(
  tx: Tx,
  args: {
    tenantId: string;
    ownerId: string;
    input: CreateSowInput;
  },
): Promise<SowDetail> {
  const { tenantId, ownerId, input } = args;
  if (!input.title.trim()) {
    throw new SowServiceError("title is required", "validation");
  }

  const sow = await tx.sow.create({
    data: {
      tenantId,
      ownerId,
      title: input.title.trim(),
      status: "draft",
      activeVersion: 1,
      confidentiality: input.confidentiality ?? "internal",
      versions: {
        create: {
          version: 1,
          tenantId,
          payload: (input.payload ?? {}) as Prisma.InputJsonValue,
          body: input.body ?? null,
          changeNote: "Initial draft",
          createdBy: ownerId,
        },
      },
    },
  });

  return (await getSowDetail(tx, sow.id))!;
}

/**
 * Update a draft SOW. Only allowed when status === 'draft'. Creates a
 * new SowVersion if payload or body changed; metadata-only edits
 * (title / confidentiality) update the Sow row only.
 *
 * Returns the updated detail.
 */
export async function updateSowDraft(
  tx: Tx,
  args: {
    sowId: string;
    actorId: string;
    input: UpdateSowDraftInput;
  },
): Promise<SowDetail> {
  const { sowId, actorId, input } = args;
  const sow = await tx.sow.findFirst({
    where: { id: sowId, deletedAt: null },
  });
  if (!sow) throw new SowServiceError("SOW not found", "not_found");
  if (sow.status !== "draft") {
    throw new SowServiceError(
      `Cannot edit a SOW in '${sow.status}' state — withdraw first if needed`,
      "invalid_state",
    );
  }

  const payloadChanged = input.payload !== undefined;
  const bodyChanged = input.body !== undefined;

  // Metadata updates on the Sow row
  const metaUpdate: Prisma.SowUpdateInput = {};
  if (input.title !== undefined) {
    if (!input.title.trim()) {
      throw new SowServiceError("title cannot be empty", "validation");
    }
    metaUpdate.title = input.title.trim();
  }
  if (input.confidentiality !== undefined) {
    metaUpdate.confidentiality = input.confidentiality;
  }

  // New version snapshot when payload or body changed
  if (payloadChanged || bodyChanged) {
    const currentVersion = await tx.sowVersion.findFirst({
      where: { sowId: sow.id, version: sow.activeVersion },
    });
    const nextVersion = sow.activeVersion + 1;

    await tx.sowVersion.update({
      where: { sowId_version: { sowId: sow.id, version: sow.activeVersion } },
      data: { supersededAt: new Date() },
    });

    await tx.sowVersion.create({
      data: {
        sowId: sow.id,
        version: nextVersion,
        tenantId: sow.tenantId,
        payload: (payloadChanged
          ? input.payload!
          : (currentVersion?.payload ?? {})) as Prisma.InputJsonValue,
        body: bodyChanged ? (input.body ?? null) : (currentVersion?.body ?? null),
        changeNote: input.changeNote ?? null,
        createdBy: actorId,
      },
    });

    metaUpdate.activeVersion = nextVersion;
  }

  if (Object.keys(metaUpdate).length > 0) {
    await tx.sow.update({ where: { id: sow.id }, data: metaUpdate });
  }

  return (await getSowDetail(tx, sow.id))!;
}

/**
 * Move a draft into the approval pipeline. Sets status='approval',
 * stage='commercial' (Glimmora gate first), and creates a pending Approval
 * row at the commercial stage.
 *
 * The active SowVersion at submit time is frozen as the version
 * approvers vote on. If the sponsor later sends a draft change while
 * approval is pending, that's an explicit "withdraw and resubmit" —
 * not silent.
 */
export async function submitSowForApproval(
  tx: Tx,
  args: { sowId: string; actorId: string },
): Promise<SowDetail> {
  const { sowId, actorId } = args;
  const sow = await tx.sow.findFirst({
    where: { id: sowId, deletedAt: null },
  });
  if (!sow) throw new SowServiceError("SOW not found", "not_found");
  if (sow.status !== "draft") {
    throw new SowServiceError(
      `Cannot submit a SOW in '${sow.status}' state`,
      "invalid_state",
    );
  }
  if (sow.ownerId !== actorId) {
    throw new SowServiceError(
      "Only the SOW owner can submit for approval",
      "forbidden",
    );
  }

  const now = new Date();
  const firstStage: SowStage = APPROVAL_STAGE_ORDER[0];

  await tx.sow.update({
    where: { id: sow.id },
    data: {
      status: "approval",
      stage: firstStage,
      submittedForApprovalAt: now,
    },
  });

  await tx.approval.create({
    data: {
      sowId: sow.id,
      sowVersion: sow.activeVersion,
      tenantId: sow.tenantId,
      stage: firstStage,
      decision: "pending",
    },
  });

  return (await getSowDetail(tx, sow.id))!;
}

/**
 * Withdraw a SOW from the approval pipeline. Returns to draft so the
 * sponsor can edit + resubmit. Withdraws ALL pending approval rows.
 */
export async function withdrawSow(
  tx: Tx,
  args: { sowId: string; actorId: string; reason?: string },
): Promise<SowDetail> {
  const { sowId, actorId, reason } = args;
  const sow = await tx.sow.findFirst({
    where: { id: sowId, deletedAt: null },
  });
  if (!sow) throw new SowServiceError("SOW not found", "not_found");
  if (sow.status !== "approval") {
    throw new SowServiceError(
      `Cannot withdraw a SOW in '${sow.status}' state`,
      "invalid_state",
    );
  }
  if (sow.ownerId !== actorId) {
    throw new SowServiceError(
      "Only the SOW owner can withdraw",
      "forbidden",
    );
  }

  const now = new Date();
  await tx.sow.update({
    where: { id: sow.id },
    data: {
      status: "draft",
      stage: null,
      withdrawnAt: now,
    },
  });

  await tx.approval.updateMany({
    where: { sowId: sow.id, decision: "pending" },
    data: {
      decision: "send_back",
      decidedAt: now,
      comment: reason ?? "Withdrawn by owner",
    },
  });

  return (await getSowDetail(tx, sow.id))!;
}

/**
 * Archive a SOW (terminal). Allowed from rejected / approved / draft
 * states. Sets status=archived and archivedAt; does not soft-delete.
 */
export async function archiveSow(
  tx: Tx,
  args: { sowId: string; actorId: string },
): Promise<SowDetail> {
  const { sowId } = args;
  const sow = await tx.sow.findFirst({
    where: { id: sowId, deletedAt: null },
  });
  if (!sow) throw new SowServiceError("SOW not found", "not_found");
  if (sow.status === "archived") {
    throw new SowServiceError("SOW is already archived", "invalid_state");
  }
  if (sow.status === "approval") {
    throw new SowServiceError(
      "Withdraw the SOW from approval before archiving",
      "invalid_state",
    );
  }

  const now = new Date();
  await tx.sow.update({
    where: { id: sow.id },
    data: { status: "archived", archivedAt: now },
  });

  return (await getSowDetail(tx, sow.id))!;
}

/* ──────────────────────── Approval pipeline ──────────────────────── */

/**
 * The result a route handler needs to drive notifications + audit
 * payload composition. `advancedTo` is the next pending stage (or
 * null if the SOW reached approved/rejected terminal state).
 */
export interface ApprovalTransitionResult {
  detail: SowDetail;
  /** The stage that just made a decision. */
  fromStage: SowStage;
  /** The new current stage (null if terminal). */
  advancedTo: SowStage | null;
  /** True iff the transition finalized status='approved' or 'rejected'. */
  terminal: boolean;
  /** The closed Approval row's id — useful for audit payload. */
  closedApprovalId: string;
}

function nextStage(stage: SowStage): SowStage | null {
  const idx = APPROVAL_STAGE_ORDER.indexOf(stage);
  if (idx < 0 || idx === APPROVAL_STAGE_ORDER.length - 1) return null;
  return APPROVAL_STAGE_ORDER[idx + 1];
}

function stageIndex(stage: SowStage): number {
  return APPROVAL_STAGE_ORDER.indexOf(stage);
}

/**
 * Internal: locate the SOW + verify it's mid-approval at the given
 * stage with a pending Approval row. Throws SowServiceError on any
 * precondition failure. Returns the loaded sow + pending approval.
 */
async function loadApprovalContext(
  tx: Tx,
  sowId: string,
  expectedStage: SowStage,
): Promise<{
  sow: NonNullable<Awaited<ReturnType<Tx["sow"]["findFirst"]>>>;
  pending: NonNullable<Awaited<ReturnType<Tx["approval"]["findFirst"]>>>;
}> {
  const sow = await tx.sow.findFirst({
    where: { id: sowId, deletedAt: null },
  });
  if (!sow) throw new SowServiceError("SOW not found", "not_found");
  if (sow.status !== "approval") {
    throw new SowServiceError(
      `SOW is in '${sow.status}' state — no approval decision possible`,
      "invalid_state",
    );
  }
  if (sow.stage !== expectedStage) {
    throw new SowServiceError(
      `SOW is currently at stage '${sow.stage}', not '${expectedStage}'`,
      "invalid_state",
    );
  }
  const pending = await tx.approval.findFirst({
    where: {
      sowId: sow.id,
      stage: expectedStage,
      decision: "pending",
    },
    orderBy: { createdAt: "desc" },
  });
  if (!pending) {
    throw new SowServiceError(
      `No pending approval row found at stage '${expectedStage}'`,
      "invalid_state",
    );
  }
  return { sow, pending };
}

/**
 * Approve at the current stage. Closes the pending Approval with
 * decision='approved' and either advances to the next stage (creating
 * a new pending row) or, when the current stage is the last one,
 * marks the SOW as approved.
 *
 * The caller MUST have already verified that the actor holds
 * `approve.sow.<stage>` via userHasPermission.
 */
export async function approveSowAtStage(
  tx: Tx,
  args: {
    sowId: string;
    actorId: string;
    stage: SowStage;
    comment?: string;
  },
): Promise<ApprovalTransitionResult> {
  const { sowId, actorId, stage, comment } = args;
  const { sow, pending } = await loadApprovalContext(tx, sowId, stage);

  const now = new Date();
  await tx.approval.update({
    where: { id: pending.id },
    data: {
      decision: "approved",
      approverId: actorId,
      comment: comment ?? null,
      decidedAt: now,
    },
  });

  const next = nextStage(stage);
  let advancedTo: SowStage | null = null;
  let terminal = false;

  if (next) {
    // Advance to next stage; open a new pending Approval row there.
    await tx.sow.update({
      where: { id: sow.id },
      data: { stage: next },
    });
    await tx.approval.create({
      data: {
        sowId: sow.id,
        sowVersion: sow.activeVersion,
        tenantId: sow.tenantId,
        stage: next,
        decision: "pending",
      },
    });
    advancedTo = next;
  } else {
    // Final stage approved → SOW approved.
    await tx.sow.update({
      where: { id: sow.id },
      data: { status: "approved", stage: null, approvedAt: now },
    });
    terminal = true;
  }

  return {
    detail: (await getSowDetail(tx, sow.id))!,
    fromStage: stage,
    advancedTo,
    terminal,
    closedApprovalId: pending.id,
  };
}

/**
 * Reject at the current stage. Closes the pending Approval with
 * decision='rejected', marks the SOW as rejected (status='rejected',
 * stage=null, rejectedAt=now). Comment is required.
 *
 * The caller MUST have verified the actor holds `approve.sow.<stage>`
 * (the stage-owner is also the one empowered to reject there).
 */
export async function rejectSowAtStage(
  tx: Tx,
  args: {
    sowId: string;
    actorId: string;
    stage: SowStage;
    comment: string;
  },
): Promise<ApprovalTransitionResult> {
  const { sowId, actorId, stage, comment } = args;
  if (!comment.trim()) {
    throw new SowServiceError(
      "comment is required to reject a SOW",
      "validation",
    );
  }
  const { sow, pending } = await loadApprovalContext(tx, sowId, stage);

  const now = new Date();
  await tx.approval.update({
    where: { id: pending.id },
    data: {
      decision: "rejected",
      approverId: actorId,
      comment,
      decidedAt: now,
    },
  });

  await tx.sow.update({
    where: { id: sow.id },
    data: { status: "rejected", stage: null, rejectedAt: now },
  });

  return {
    detail: (await getSowDetail(tx, sow.id))!,
    fromStage: stage,
    advancedTo: null,
    terminal: true,
    closedApprovalId: pending.id,
  };
}

/**
 * Send the SOW back to an earlier stage. Closes the current pending
 * approval as 'send_back' and opens a new pending row at `toStage`.
 * `toStage` must be strictly earlier in the pipeline.
 *
 * The closed approvals from intermediate stages remain in history;
 * the sponsor sees them when reviewing the trail. The downstream
 * stages between `toStage+1` and `fromStage-1` already approved at
 * the original version, but those approvals don't apply to the new
 * version produced by re-work — once the sponsor edits, those
 * stages will need to re-approve when the SOW advances again. (For
 * Phase 1 we keep those rows intact as audit history; M9c can decide
 * whether to invalidate them visually.)
 *
 * The caller MUST have verified the actor holds `approve.sow.<fromStage>`.
 */
export async function sendBackSowFromStage(
  tx: Tx,
  args: {
    sowId: string;
    actorId: string;
    fromStage: SowStage;
    toStage: SowStage;
    comment: string;
  },
): Promise<ApprovalTransitionResult> {
  const { sowId, actorId, fromStage, toStage, comment } = args;
  if (!comment.trim()) {
    throw new SowServiceError(
      "comment is required to send a SOW back",
      "validation",
    );
  }
  if (stageIndex(toStage) >= stageIndex(fromStage)) {
    throw new SowServiceError(
      `toStage '${toStage}' must be earlier than fromStage '${fromStage}'`,
      "validation",
    );
  }
  const { sow, pending } = await loadApprovalContext(tx, sowId, fromStage);

  const now = new Date();
  await tx.approval.update({
    where: { id: pending.id },
    data: {
      decision: "send_back",
      approverId: actorId,
      comment,
      decidedAt: now,
    },
  });

  await tx.sow.update({
    where: { id: sow.id },
    data: { stage: toStage },
  });

  await tx.approval.create({
    data: {
      sowId: sow.id,
      sowVersion: sow.activeVersion,
      tenantId: sow.tenantId,
      stage: toStage,
      decision: "pending",
    },
  });

  return {
    detail: (await getSowDetail(tx, sow.id))!,
    fromStage,
    advancedTo: toStage,
    terminal: false,
    closedApprovalId: pending.id,
  };
}

/**
 * Find every userId in the tenant who holds the per-stage approval
 * permission. Used by route handlers to fan out notifications when a
 * stage becomes pending. Includes both tenant-scoped UserRole rows
 * (`tenantId = ?`) and globally-scoped ones (`tenantId IS NULL`).
 */
export async function findStageApprovers(
  tx: Tx,
  args: { tenantId: string; stage: SowStage },
): Promise<string[]> {
  const code = `approve.sow.${args.stage}`;
  const rows = await tx.userRole.findMany({
    where: {
      OR: [{ tenantId: args.tenantId }, { tenantId: null }],
      role: {
        rolePermissions: { some: { permissionCode: code } },
      },
      user: { tenantId: args.tenantId },
    },
    select: { userId: true },
    distinct: ["userId"],
  });
  return rows.map((r) => r.userId);
}
