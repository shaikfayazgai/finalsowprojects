/**
 * Enterprise billing v3 types — explicit invoice + payout lifecycle.
 *
 * The v2 hook derived a 4-state invoice machine implicitly from task counts.
 * v3 promotes invoices to first-class entities with an explicit 7-state
 * lifecycle, recorded approvals, disputes, and payout batches.
 */

export type InvoiceState =
  | "eligible"
  | "draft"
  | "pending_approval"
  | "approved"
  | "sent"
  | "paid"
  | "reconciled";

export type InvoiceFlag =
  | "overdue"
  | "disputed"
  | "partial_payment"
  | "failed_payment"
  | "on_hold"
  | "duplicate_suspected"
  | "approval_stale"
  | "budget_overrun";

export interface ApprovalRecord {
  id: string;
  approverName: string;
  approverInitials: string;
  approverRole: "program_lead" | "finance" | "cfo" | "legal";
  state: "pending" | "approved" | "rejected";
  decidedAt?: string;
  note?: string;
}

export interface DisputeRecord {
  id: string;
  raisedAt: string;
  raisedBy: string;
  reason: string;
  lineIds: string[];
  resolvedAt?: string;
  resolution?: "credit_note" | "adjusted" | "withdrawn";
}

export interface InvoiceAuditEntry {
  id: string;
  at: string;
  kind:
    | "drafted"
    | "submitted_for_approval"
    | "approved"
    | "rejected"
    | "sent"
    | "paid"
    | "partial_paid"
    | "reconciled"
    | "disputed"
    | "dispute_resolved"
    | "flagged"
    | "edited";
  actor: string;
  detail?: string;
}

/**
 * Overrides recorded by the operator that ride on top of the derived
 * v2 invoice. The v3 hook merges these into the final invoice view.
 */
export interface InvoiceMetadata {
  invoiceId: string;
  state: InvoiceState;
  /** Active flags (banner-worthy edge states like overdue, failed payment). */
  flags: InvoiceFlag[];
  approvals: ApprovalRecord[];
  disputes: DisputeRecord[];
  audit: InvoiceAuditEntry[];
  /** Recorded amounts that override derived totals — only set on explicit edit. */
  taxCents?: number;
  paidCents?: number;
  /** ISO timestamps captured at each transition. */
  draftedAt?: string;
  submittedForApprovalAt?: string;
  approvedAt?: string;
  sentAt?: string;
  paidAt?: string;
  reconciledAt?: string;
  /** Manual due-date override; otherwise derived as issued + 14d. */
  dueAtOverride?: string;
}

export type PayoutBatchState =
  | "preparing"
  | "ready"
  | "in_flight"
  | "completed"
  | "failed"
  | "on_hold";

export interface PayoutEntry {
  id: string;
  contributorName: string;
  contributorInitials: string;
  /** Source task id (links back into the unified task store). */
  sourceTaskId: string;
  amountCents: number;
  state: "ready" | "in_flight" | "completed" | "failed" | "on_hold";
  /** Reason a payout is held or failed (kyc, beneficiary_mismatch, etc.). */
  holdReason?: string;
}

export interface PayoutBatch {
  id: string;
  /** Display label, e.g. "BAT-2026-W08". */
  label: string;
  state: PayoutBatchState;
  createdAt: string;
  sentAt?: string;
  entries: PayoutEntry[];
  totalCents: number;
}

export interface InvoiceLifecycleNode {
  state: InvoiceState;
  label: string;
  sub: string;
}

export const INVOICE_LIFECYCLE: InvoiceLifecycleNode[] = [
  { state: "eligible", label: "Eligible", sub: "Accepted work" },
  { state: "draft", label: "Draft", sub: "Composed" },
  { state: "pending_approval", label: "Pending", sub: "Awaiting sign-off" },
  { state: "approved", label: "Approved", sub: "Ready to send" },
  { state: "sent", label: "Sent", sub: "Awaiting payment" },
  { state: "paid", label: "Paid", sub: "Payment received" },
  { state: "reconciled", label: "Reconciled", sub: "Ledger closed" },
];
