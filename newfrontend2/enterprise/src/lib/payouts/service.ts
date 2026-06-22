/**
 * Payout service (M17a) — schema + eligibility.
 *
 * Core flow:
 *   - When a submission flips to 'accepted', `markPayoutEligibleOnAcceptance`
 *     creates a PayoutRecord row with status='eligible' + computed amount.
 *   - The contributor sees it in their earnings view.
 *   - M17b will wire the withdrawal pipeline (requested → processing → sent).
 *
 * Computation: amount = task.estimatedHours × task.agreedRatePerHour
 * (or a platform default). Snapshotted into `computation` JSON for
 * audit + reproducibility.
 *
 * Idempotency: PayoutRecord has `@@unique` on submissionId. Calling
 * markPayoutEligible twice for the same submission returns the existing
 * record instead of creating a duplicate.
 */

import { Prisma } from "@/generated/prisma/client";
import {
  PHASE1_DEFAULT_RATE_PER_HOUR_INR,
  type CreatePayoutMethodInput,
  type PayoutComputationBreakdown,
  type PayoutDetail,
  type PayoutMethodDetail,
  type PayoutMethodKind,
  type PayoutStatus,
} from "./types";

type Tx = Prisma.TransactionClient;

export class PayoutServiceError extends Error {
  constructor(
    message: string,
    public code:
      | "not_found"
      | "invalid_state"
      | "validation"
      | "forbidden"
      | "conflict",
  ) {
    super(message);
    this.name = "PayoutServiceError";
  }
}

/* ─────────────────────────── Mappers ─────────────────────────── */

function toIso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

function toPayoutDetail(row: {
  id: string;
  contributorId: string;
  taskDefinitionId: string;
  submissionId: string;
  tenantId: string;
  amountMinor: number;
  currency: string;
  computation: Prisma.JsonValue;
  status: string;
  payoutMethodId: string | null;
  externalRef: string | null;
  failureReason: string | null;
  eligibleAt: Date;
  requestedAt: Date | null;
  processingAt: Date | null;
  sentAt: Date | null;
  failedAt: Date | null;
  onHoldAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): PayoutDetail {
  return {
    id: row.id,
    contributorId: row.contributorId,
    taskDefinitionId: row.taskDefinitionId,
    submissionId: row.submissionId,
    tenantId: row.tenantId,
    amountMinor: row.amountMinor,
    currency: row.currency,
    computation: row.computation as unknown as PayoutComputationBreakdown,
    status: row.status as PayoutStatus,
    payoutMethodId: row.payoutMethodId,
    externalRef: row.externalRef,
    failureReason: row.failureReason,
    eligibleAt: row.eligibleAt.toISOString(),
    requestedAt: toIso(row.requestedAt),
    processingAt: toIso(row.processingAt),
    sentAt: toIso(row.sentAt),
    failedAt: toIso(row.failedAt),
    onHoldAt: toIso(row.onHoldAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/* ─────────────────────── Payload masking ─────────────────────── */

/**
 * Strip / mask sensitive bits from PayoutMethod.payload when returning
 * it to the API layer. Bank account numbers + UPI VPAs are masked.
 * The raw payload stays in DB for the withdrawal rail; display layers
 * only get the masked view.
 */
function maskPayoutMethodPayload(
  kind: string,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const masked: Record<string, unknown> = { ...payload };
  if (kind === "bank_in") {
    if (typeof masked.accountNumber === "string") {
      const acc = masked.accountNumber;
      masked.accountNumber =
        acc.length > 4 ? "••••••" + acc.slice(-4) : "••••";
    }
  } else if (kind === "upi") {
    if (typeof masked.vpa === "string") {
      const vpa = masked.vpa;
      const at = vpa.indexOf("@");
      if (at > 0) {
        const head = vpa.slice(0, at);
        const tail = vpa.slice(at);
        const visible = head.length > 2 ? head.slice(0, 2) : head;
        masked.vpa = visible + "••••" + tail;
      }
    }
  } else if (kind === "paypal") {
    if (typeof masked.email === "string") {
      const email = masked.email;
      const at = email.indexOf("@");
      if (at > 1) {
        masked.email = email[0] + "••••" + email.slice(at);
      }
    }
  }
  // razorpay_x: fundAccountId is already a Razorpay-side ref, not sensitive
  return masked;
}

function toPayoutMethodDetail(row: {
  id: string;
  userId: string;
  kind: string;
  nickname: string | null;
  payload: Prisma.JsonValue;
  isDefault: boolean;
  verifiedAt: Date | null;
  verificationError: string | null;
  createdAt: Date;
  updatedAt: Date;
}): PayoutMethodDetail {
  const payload = (row.payload ?? {}) as Record<string, unknown>;
  return {
    id: row.id,
    userId: row.userId,
    kind: row.kind as PayoutMethodKind,
    nickname: row.nickname,
    payload: maskPayoutMethodPayload(row.kind, payload),
    isDefault: row.isDefault,
    verifiedAt: toIso(row.verifiedAt),
    verificationError: row.verificationError,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/* ───────────────────────── Computation ───────────────────────── */

export interface ComputePayoutInputs {
  estimatedHours: number;
  agreedRatePerHour: number | null;
  agreedCurrency: string | null;
}

/**
 * Pure: derive payout amount + breakdown from task inputs. No DB
 * access; safe to call from API routes / scheduled jobs / tests.
 *
 * Phase 1 falls back to PHASE1_DEFAULT_RATE_PER_HOUR_INR when the
 * task wasn't assigned with an explicit rate. The breakdown notes
 * the fallback so an auditor can later see "this payout used the
 * default rate, not a snapshotted rate-card rate".
 */
export function computePayoutAmount(
  inputs: ComputePayoutInputs,
): { amountMinor: number; currency: string; computation: PayoutComputationBreakdown } {
  const hoursBilled = inputs.estimatedHours;
  const usedDefault = inputs.agreedRatePerHour == null;
  const ratePerHour = inputs.agreedRatePerHour ?? PHASE1_DEFAULT_RATE_PER_HOUR_INR;
  const currency = inputs.agreedCurrency ?? "INR";
  const minorMultiplier = 100; // INR + USD both use 2 decimal subunits
  // Defensive rounding to avoid floating-point fan-out at the boundary.
  const amountMinor = Math.round(hoursBilled * ratePerHour * minorMultiplier);

  const computation: PayoutComputationBreakdown = {
    currency,
    ratePerHour,
    hoursBilled,
    amountMinor,
    minorMultiplier,
    notes: usedDefault
      ? `Used Phase 1 default rate ₹${PHASE1_DEFAULT_RATE_PER_HOUR_INR}/hr — task had no agreedRatePerHour at acceptance.`
      : undefined,
  };
  return { amountMinor, currency, computation };
}

/* ───────────────────────── Eligibility ───────────────────────── */

/**
 * Called from the mentor decision flow when status flips to 'accepted'.
 * Creates a PayoutRecord with status='eligible' + computed amount.
 * Idempotent on (submissionId).
 *
 * The notification dispatch (kind: 'payout.eligible') is the caller's
 * responsibility — keeps the service free of notification side-effects
 * so tests can verify each layer independently.
 */
export async function markPayoutEligibleOnAcceptance(
  tx: Tx,
  args: {
    submissionId: string;
    taskDefinitionId: string;
    contributorId: string;
    tenantId: string;
    estimatedHours: number | null;
    agreedRatePerHour: number | null;
    agreedCurrency: string | null;
  },
): Promise<PayoutDetail> {
  // Idempotency: return existing row when present
  const existing = await tx.payoutRecord.findUnique({
    where: { submissionId: args.submissionId },
  });
  if (existing) {
    return toPayoutDetail(existing);
  }

  if (args.estimatedHours == null || args.estimatedHours <= 0) {
    throw new PayoutServiceError(
      "Task has no estimatedHours — cannot compute payout amount",
      "validation",
    );
  }

  const { amountMinor, currency, computation } = computePayoutAmount({
    estimatedHours: args.estimatedHours,
    agreedRatePerHour: args.agreedRatePerHour,
    agreedCurrency: args.agreedCurrency,
  });

  const created = await tx.payoutRecord.create({
    data: {
      submissionId: args.submissionId,
      taskDefinitionId: args.taskDefinitionId,
      contributorId: args.contributorId,
      tenantId: args.tenantId,
      amountMinor,
      currency,
      computation: computation as unknown as Prisma.InputJsonValue,
      status: "eligible",
    },
  });

  return toPayoutDetail(created);
}

/* ──────────────────────── Payout methods ──────────────────────── */

/**
 * Add a payout method for a contributor. If `setDefault` is true OR
 * this is the user's first method, marks it default and demotes any
 * other default.
 */
export async function createPayoutMethod(
  tx: Tx,
  args: { userId: string; input: CreatePayoutMethodInput },
): Promise<PayoutMethodDetail> {
  const { userId, input } = args;
  if (!input.kind) {
    throw new PayoutServiceError("kind is required", "validation");
  }
  // Basic per-kind sanity checks on payload
  if (input.kind === "bank_in") {
    const p = input.payload;
    if (typeof p.accountNumber !== "string" || typeof p.ifsc !== "string") {
      throw new PayoutServiceError(
        "bank_in payload requires accountNumber + ifsc",
        "validation",
      );
    }
  } else if (input.kind === "upi") {
    if (typeof input.payload.vpa !== "string" || !input.payload.vpa.includes("@")) {
      throw new PayoutServiceError("upi payload requires a valid vpa", "validation");
    }
  } else if (input.kind === "paypal") {
    if (typeof input.payload.email !== "string") {
      throw new PayoutServiceError("paypal payload requires an email", "validation");
    }
  } else if (input.kind === "razorpay_x") {
    if (typeof input.payload.fundAccountId !== "string") {
      throw new PayoutServiceError(
        "razorpay_x payload requires a fundAccountId",
        "validation",
      );
    }
  }

  const existingCount = await tx.payoutMethod.count({
    where: { userId, deletedAt: null },
  });
  const shouldBeDefault = input.setDefault === true || existingCount === 0;

  if (shouldBeDefault) {
    await tx.payoutMethod.updateMany({
      where: { userId, isDefault: true, deletedAt: null },
      data: { isDefault: false },
    });
  }

  const created = await tx.payoutMethod.create({
    data: {
      userId,
      kind: input.kind,
      nickname: input.nickname ?? null,
      payload: input.payload as Prisma.InputJsonValue,
      isDefault: shouldBeDefault,
    },
  });
  return toPayoutMethodDetail(created);
}

export async function setDefaultPayoutMethod(
  tx: Tx,
  args: { userId: string; methodId: string },
): Promise<PayoutMethodDetail> {
  const m = await tx.payoutMethod.findFirst({
    where: { id: args.methodId, userId: args.userId, deletedAt: null },
  });
  if (!m) throw new PayoutServiceError("Payout method not found", "not_found");

  await tx.payoutMethod.updateMany({
    where: { userId: args.userId, isDefault: true, deletedAt: null },
    data: { isDefault: false },
  });
  const updated = await tx.payoutMethod.update({
    where: { id: m.id },
    data: { isDefault: true },
  });
  return toPayoutMethodDetail(updated);
}

export async function softDeletePayoutMethod(
  tx: Tx,
  args: { userId: string; methodId: string },
): Promise<void> {
  const m = await tx.payoutMethod.findFirst({
    where: { id: args.methodId, userId: args.userId, deletedAt: null },
  });
  if (!m) throw new PayoutServiceError("Payout method not found", "not_found");
  await tx.payoutMethod.update({
    where: { id: m.id },
    data: { deletedAt: new Date(), isDefault: false },
  });
}

export async function listPayoutMethodsForUser(
  tx: Tx,
  userId: string,
): Promise<PayoutMethodDetail[]> {
  const rows = await tx.payoutMethod.findMany({
    where: { userId, deletedAt: null },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(toPayoutMethodDetail);
}

/* ───────────────────────── Payout reads ───────────────────────── */

/**
 * Contributor's payouts across all tenants. App-layer filter on
 * contributorId — PayoutRecord has no RLS so this is the authoritative
 * scope check.
 */
export async function listPayoutsForContributor(
  tx: Tx,
  args: { contributorUserId: string; statuses?: PayoutStatus[]; limit?: number },
): Promise<PayoutDetail[]> {
  const where: Prisma.PayoutRecordWhereInput = {
    contributorId: args.contributorUserId,
    deletedAt: null,
    ...(args.statuses && args.statuses.length > 0
      ? { status: { in: args.statuses } }
      : {}),
  };
  const rows = await tx.payoutRecord.findMany({
    where,
    orderBy: { eligibleAt: "desc" },
    take: args.limit ?? 100,
  });
  return rows.map(toPayoutDetail);
}

/**
 * Tenant's payouts. The caller is expected to be a finance/PMO/admin
 * within the tenant.
 */
export async function listPayoutsForTenant(
  tx: Tx,
  args: { tenantId: string; statuses?: PayoutStatus[]; limit?: number },
): Promise<PayoutDetail[]> {
  const where: Prisma.PayoutRecordWhereInput = {
    tenantId: args.tenantId,
    deletedAt: null,
    ...(args.statuses && args.statuses.length > 0
      ? { status: { in: args.statuses } }
      : {}),
  };
  const rows = await tx.payoutRecord.findMany({
    where,
    orderBy: { eligibleAt: "desc" },
    take: args.limit ?? 100,
  });
  return rows.map(toPayoutDetail);
}

export async function getPayoutDetail(
  tx: Tx,
  payoutId: string,
): Promise<PayoutDetail | null> {
  const row = await tx.payoutRecord.findFirst({
    where: { id: payoutId, deletedAt: null },
  });
  return row ? toPayoutDetail(row) : null;
}

/* ════════════════════════ M17b — Withdrawal state machine ═════════ */

/**
 * Lifecycle transitions:
 *
 *   eligible ──► requested  (contributor presses "Withdraw")
 *   requested ──► processing (rail adapter accepted the request)
 *   processing ──► sent       (success terminal)
 *              ──► failed     (retryable: → eligible)
 *              ──► on_hold    (T&S / KYC freeze)
 *   * ──► on_hold ──► eligible  (release after review)
 *
 * Each transition guards on:
 *   - Allowed from-status
 *   - Ownership (contributor-self for request/retry; system for rest)
 *   - Per-step preconditions (payout method present for request etc.)
 */

const ALLOWED_NEXT: Record<PayoutStatus, PayoutStatus[]> = {
  eligible: ["requested", "on_hold"],
  requested: ["processing", "on_hold", "failed"],
  processing: ["sent", "failed", "on_hold"],
  sent: [], // terminal
  failed: ["eligible", "on_hold"], // retry returns to eligible
  on_hold: ["eligible"],
};

function ensureTransition(from: PayoutStatus, to: PayoutStatus) {
  if (!ALLOWED_NEXT[from].includes(to)) {
    throw new PayoutServiceError(
      `Illegal payout transition: ${from} → ${to}`,
      "invalid_state",
    );
  }
}

/**
 * Contributor initiates a withdrawal. Picks an existing payout method
 * (defaulting to their isDefault one). Flips status eligible → requested.
 * The rail-adapter call happens AFTER this (route handler invokes the
 * Razorpay X adapter to create the actual external payout, then calls
 * `markPayoutProcessing`).
 */
export async function requestPayoutWithdrawal(
  tx: Tx,
  args: { payoutId: string; contributorUserId: string; payoutMethodId?: string },
): Promise<PayoutDetail> {
  const row = await tx.payoutRecord.findFirst({
    where: { id: args.payoutId, deletedAt: null },
  });
  if (!row) throw new PayoutServiceError("Payout not found", "not_found");
  if (row.contributorId !== args.contributorUserId) {
    throw new PayoutServiceError(
      "Only the payout recipient can request withdrawal",
      "forbidden",
    );
  }
  ensureTransition(row.status as PayoutStatus, "requested");

  // M26: refuse withdrawal when the rail is degraded/down. Operator
  // must either restore the rail or the contributor must wait. We don't
  // auto-hold here — the payout stays 'eligible' so the contributor can
  // try again later once the rail is healthy.
  const railHealth = await getRailStatus(tx);
  if (railHealth.status !== "active") {
    throw new PayoutServiceError(
      `Payouts rail is currently ${railHealth.status}${railHealth.reason ? `: ${railHealth.reason}` : ""}. Try again once the rail is restored.`,
      "invalid_state",
    );
  }

  // Resolve payout method
  let methodId = args.payoutMethodId;
  if (!methodId) {
    const def = await tx.payoutMethod.findFirst({
      where: {
        userId: args.contributorUserId,
        isDefault: true,
        deletedAt: null,
      },
    });
    if (!def) {
      throw new PayoutServiceError(
        "No default payout method set — add one before withdrawing",
        "validation",
      );
    }
    methodId = def.id;
  } else {
    const m = await tx.payoutMethod.findFirst({
      where: {
        id: methodId,
        userId: args.contributorUserId,
        deletedAt: null,
      },
    });
    if (!m) {
      throw new PayoutServiceError(
        "Payout method not found for this contributor",
        "not_found",
      );
    }
  }

  const updated = await tx.payoutRecord.update({
    where: { id: row.id },
    data: {
      status: "requested",
      payoutMethodId: methodId,
      requestedAt: new Date(),
      // Clear stale failure data when re-requesting after a failure
      failedAt: null,
      failureReason: null,
    },
  });
  return toPayoutDetail(updated);
}

/**
 * Rail adapter accepted the request (Razorpay X returned an external
 * payout id). Flips requested → processing and records externalRef.
 */
export async function markPayoutProcessing(
  tx: Tx,
  args: { payoutId: string; externalRef: string },
): Promise<PayoutDetail> {
  const row = await tx.payoutRecord.findFirst({
    where: { id: args.payoutId, deletedAt: null },
  });
  if (!row) throw new PayoutServiceError("Payout not found", "not_found");
  ensureTransition(row.status as PayoutStatus, "processing");

  const updated = await tx.payoutRecord.update({
    where: { id: row.id },
    data: {
      status: "processing",
      externalRef: args.externalRef,
      processingAt: new Date(),
    },
  });
  return toPayoutDetail(updated);
}

/**
 * Webhook confirmation: payout reached the contributor's account.
 * processing → sent. Terminal.
 */
export async function markPayoutSent(
  tx: Tx,
  args: { payoutId: string; externalRef?: string },
): Promise<PayoutDetail> {
  const row = await tx.payoutRecord.findFirst({
    where: { id: args.payoutId, deletedAt: null },
  });
  if (!row) throw new PayoutServiceError("Payout not found", "not_found");
  if (row.status === "sent") {
    // Idempotent: webhook may retry; same row, same answer.
    return toPayoutDetail(row);
  }
  ensureTransition(row.status as PayoutStatus, "sent");

  const updated = await tx.payoutRecord.update({
    where: { id: row.id },
    data: {
      status: "sent",
      sentAt: new Date(),
      ...(args.externalRef ? { externalRef: args.externalRef } : {}),
    },
  });
  return toPayoutDetail(updated);
}

/**
 * Webhook failure OR rail-adapter immediate rejection. Sets status
 * to 'failed' (operator action: retry returns to eligible).
 */
export async function markPayoutFailed(
  tx: Tx,
  args: { payoutId: string; reason: string; externalRef?: string },
): Promise<PayoutDetail> {
  if (!args.reason.trim()) {
    throw new PayoutServiceError("Failure reason required", "validation");
  }
  const row = await tx.payoutRecord.findFirst({
    where: { id: args.payoutId, deletedAt: null },
  });
  if (!row) throw new PayoutServiceError("Payout not found", "not_found");
  if (row.status === "failed") return toPayoutDetail(row); // idempotent
  ensureTransition(row.status as PayoutStatus, "failed");

  const updated = await tx.payoutRecord.update({
    where: { id: row.id },
    data: {
      status: "failed",
      failedAt: new Date(),
      failureReason: args.reason,
      ...(args.externalRef ? { externalRef: args.externalRef } : {}),
    },
  });
  return toPayoutDetail(updated);
}

/**
 * Operator action: failed → eligible (retry). Clears failure timestamp
 * so the contributor can re-request via the UI.
 */
export async function retryFailedPayout(
  tx: Tx,
  args: { payoutId: string },
): Promise<PayoutDetail> {
  const row = await tx.payoutRecord.findFirst({
    where: { id: args.payoutId, deletedAt: null },
  });
  if (!row) throw new PayoutServiceError("Payout not found", "not_found");
  ensureTransition(row.status as PayoutStatus, "eligible");

  const updated = await tx.payoutRecord.update({
    where: { id: row.id },
    data: {
      status: "eligible",
      failedAt: null,
      failureReason: null,
      // Keep prior requestedAt / processingAt for audit trail
    },
  });
  return toPayoutDetail(updated);
}

/**
 * T&S / KYC freeze. * → on_hold. Reason required.
 */
export async function holdPayout(
  tx: Tx,
  args: { payoutId: string; reason: string },
): Promise<PayoutDetail> {
  if (!args.reason.trim()) {
    throw new PayoutServiceError("Hold reason required", "validation");
  }
  const row = await tx.payoutRecord.findFirst({
    where: { id: args.payoutId, deletedAt: null },
  });
  if (!row) throw new PayoutServiceError("Payout not found", "not_found");
  if (row.status === "sent") {
    throw new PayoutServiceError(
      "Cannot hold a payout that has already been sent",
      "invalid_state",
    );
  }
  if (row.status === "on_hold") return toPayoutDetail(row);

  const updated = await tx.payoutRecord.update({
    where: { id: row.id },
    data: {
      status: "on_hold",
      onHoldAt: new Date(),
      failureReason: args.reason, // reused for hold reason
    },
  });
  return toPayoutDetail(updated);
}

/**
 * Release a hold. on_hold → eligible. Clears failureReason.
 */
export async function releasePayoutHold(
  tx: Tx,
  args: { payoutId: string },
): Promise<PayoutDetail> {
  const row = await tx.payoutRecord.findFirst({
    where: { id: args.payoutId, deletedAt: null },
  });
  if (!row) throw new PayoutServiceError("Payout not found", "not_found");
  ensureTransition(row.status as PayoutStatus, "eligible");

  const updated = await tx.payoutRecord.update({
    where: { id: row.id },
    data: {
      status: "eligible",
      onHoldAt: null,
      failureReason: null,
    },
  });
  return toPayoutDetail(updated);
}

/* ════════════════════════ M26 — Rail health + drain ═════════════════ */

export type RailStatus = "active" | "degraded" | "down";

export interface RailHealthSnapshot {
  rail: string;
  status: RailStatus;
  reason: string | null;
  updatedBy: string | null;
  updatedAt: string;
}

const DEFAULT_RAIL = "razorpay_x";

/**
 * Read the most recent rail-health row for the given rail. Returns a
 * synthetic 'active' snapshot when no row exists yet (fresh install).
 */
export async function getRailStatus(
  tx: Tx,
  rail = DEFAULT_RAIL,
): Promise<RailHealthSnapshot> {
  const row = await tx.railHealth.findFirst({
    where: { rail },
    orderBy: { createdAt: "desc" },
  });
  if (!row) {
    return {
      rail,
      status: "active",
      reason: null,
      updatedBy: null,
      updatedAt: new Date(0).toISOString(),
    };
  }
  return {
    rail: row.rail,
    status: row.status as RailStatus,
    reason: row.reason,
    updatedBy: row.updatedBy,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function setRailStatus(
  tx: Tx,
  args: {
    rail?: string;
    status: RailStatus;
    reason?: string;
    updatedBy: string;
  },
): Promise<RailHealthSnapshot> {
  const rail = args.rail ?? DEFAULT_RAIL;
  if (!["active", "degraded", "down"].includes(args.status)) {
    throw new PayoutServiceError(`Invalid rail status '${args.status}'`, "validation");
  }
  if (args.status !== "active" && !args.reason?.trim()) {
    throw new PayoutServiceError(
      "Non-active rail status requires a reason",
      "validation",
    );
  }
  const row = await tx.railHealth.create({
    data: {
      rail,
      status: args.status,
      reason: args.reason ?? null,
      updatedBy: args.updatedBy,
    },
  });
  return {
    rail: row.rail,
    status: row.status as RailStatus,
    reason: row.reason,
    updatedBy: row.updatedBy,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Bulk-hold all in-flight payouts (status in 'requested' or
 * 'processing') and mark them on_hold with the supplied reason. Used
 * by operators when a rail goes down and they need to freeze payouts
 * before they fail. Returns the count of rows affected.
 */
export async function drainRailToHold(
  tx: Tx,
  args: { rail?: string; reason: string; actorUserId: string },
): Promise<{ heldCount: number }> {
  if (!args.reason.trim()) {
    throw new PayoutServiceError("Drain reason required", "validation");
  }
  // Find candidates first so we can iterate + return a count
  const candidates = await tx.payoutRecord.findMany({
    where: {
      status: { in: ["requested", "processing"] },
      deletedAt: null,
    },
    select: { id: true, status: true },
  });
  let count = 0;
  for (const c of candidates) {
    try {
      await tx.payoutRecord.update({
        where: { id: c.id },
        data: {
          status: "on_hold",
          onHoldAt: new Date(),
          failureReason: args.reason,
        },
      });
      count++;
    } catch (err) {
      // Should not happen — log + continue
      // eslint-disable-next-line no-console
      console.warn(`[drainRailToHold] failed to hold ${c.id}`, err);
    }
  }
  void args.rail;
  void args.actorUserId;
  return { heldCount: count };
}
