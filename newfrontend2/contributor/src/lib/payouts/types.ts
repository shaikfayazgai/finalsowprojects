/**
 * Payout domain types (M17a).
 *
 * `PayoutRecord` lifecycle:
 *   eligible → requested → processing → sent
 *                                     → failed (retry path returns to eligible)
 *                                     → on_hold (T&S / KYC freeze)
 *
 * Amounts are stored as `amountMinor` (smallest currency unit — paise
 * for INR, cents for USD) to avoid floating-point drift on totals.
 */

export type PayoutStatus =
  | "eligible"
  | "requested"
  | "processing"
  | "sent"
  | "failed"
  | "on_hold";

export type PayoutMethodKind = "bank_in" | "upi" | "paypal" | "razorpay_x";

export interface PayoutComputationBreakdown {
  /** ISO 4217 (e.g. "INR"). */
  currency: string;
  /** Per-hour rate as the rational form for audit trail (e.g. 1200). */
  ratePerHour: number;
  /** Effort actually billed. */
  hoursBilled: number;
  /** amountMinor = round(hoursBilled * ratePerHour * minorMultiplier). */
  amountMinor: number;
  /** Default 100 for INR/USD. */
  minorMultiplier: number;
  /** Optional notes (e.g. "fallback to platform default rate"). */
  notes?: string;
}

export interface PayoutDetail {
  id: string;
  contributorId: string;
  taskDefinitionId: string;
  submissionId: string;
  tenantId: string;
  amountMinor: number;
  currency: string;
  computation: PayoutComputationBreakdown;
  status: PayoutStatus;
  payoutMethodId: string | null;
  externalRef: string | null;
  failureReason: string | null;
  eligibleAt: string;
  requestedAt: string | null;
  processingAt: string | null;
  sentAt: string | null;
  failedAt: string | null;
  onHoldAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutMethodDetail {
  id: string;
  userId: string;
  kind: PayoutMethodKind;
  nickname: string | null;
  /** Payload sanitised for display — service masks sensitive fields. */
  payload: Record<string, unknown>;
  isDefault: boolean;
  verifiedAt: string | null;
  verificationError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePayoutMethodInput {
  kind: PayoutMethodKind;
  nickname?: string;
  payload: Record<string, unknown>;
  /** When true, becomes the user's default (others demoted). */
  setDefault?: boolean;
}

/* ───────────────────── Default platform rates ───────────────────── */

/**
 * Fallback rates when a task wasn't assigned with an explicit
 * `agreedRatePerHour`. Phase 1 default; Phase 2 reads from RateCard.
 *
 * Units: per-hour rate in the main unit (rupees), NOT minor units.
 */
export const PHASE1_DEFAULT_RATE_PER_HOUR_INR = 1200;
