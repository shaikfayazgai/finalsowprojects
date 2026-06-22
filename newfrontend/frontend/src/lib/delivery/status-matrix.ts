/**
 * Delivery status matrix — single source of truth for how the SAME underlying
 * task status renders to each of the four roles.
 *
 * The backend stores ONE canonical status on the decomposition task
 * (`decomp_tasks.status`), read directly from the shared DB by every role's
 * service. The frontend maps that one code to a role-specific label here, so a
 * task in (e.g.) `qa_review_pending` reads as "QA review (with reviewer)" to the
 * enterprise, "In my queue — pending" to the reviewer, "Accepted → QA" (history)
 * to the mentor, and "Requirement check accepted · QA review pending" to the
 * contributor.
 */

export type DeliveryStatus =
  | "draft"
  | "ready"
  | "assigned"
  | "in_progress"
  | "req_check_pending"
  | "req_check_rework"
  | "req_check_failed"
  | "qa_review_pending"
  | "qa_review_rework"
  | "qa_review_failed"
  | "payment_pending"
  | "paid"
  | "declined"
  | "cancelled";

export type DeliveryRole = "enterprise" | "mentor" | "reviewer" | "contributor";

export interface DeliveryCell {
  /** Role-facing label, or null when the role doesn't see this stage at all. */
  label: string | null;
  /** Tailwind tone classes (bg + text), matching the design tokens. */
  tone: string;
  /** True when this is a past/decided stage for the role (shown in History). */
  history?: boolean;
}

const TONE = {
  neutral: "bg-bg-subtle text-text-secondary",
  info: "bg-info-subtle text-info-text",
  warning: "bg-warning-subtle text-warning-text",
  success: "bg-success-subtle text-success-text",
  error: "bg-error-subtle text-error-text",
} as const;

type Row = Record<DeliveryRole, DeliveryCell>;

/** dash = role does not see this stage. */
const dash = (tone = TONE.neutral): DeliveryCell => ({ label: null, tone });

export const DELIVERY_MATRIX: Record<DeliveryStatus, Row> = {
  draft: {
    enterprise: { label: "Draft", tone: TONE.neutral },
    mentor: dash(),
    reviewer: dash(),
    contributor: dash(),
  },
  ready: {
    enterprise: { label: "Ready to assign", tone: TONE.info },
    mentor: dash(),
    reviewer: dash(),
    contributor: { label: "Open opportunity", tone: TONE.info },
  },
  assigned: {
    enterprise: { label: "Assigned", tone: TONE.warning },
    mentor: dash(),
    reviewer: dash(),
    contributor: { label: "New — accept to start", tone: TONE.warning },
  },
  in_progress: {
    enterprise: { label: "In progress", tone: TONE.warning },
    mentor: dash(),
    reviewer: dash(),
    contributor: { label: "In progress", tone: TONE.warning },
  },
  req_check_pending: {
    enterprise: { label: "Requirement check (with mentor)", tone: TONE.info },
    mentor: { label: "In my queue — pending", tone: TONE.info },
    reviewer: dash(),
    contributor: { label: "Submitted · requirement check", tone: TONE.info },
  },
  req_check_rework: {
    enterprise: { label: "Requirement check — rework", tone: TONE.warning },
    mentor: { label: "Returned for rework", tone: TONE.warning, history: true },
    reviewer: dash(),
    contributor: { label: "Rework needed · requirement check", tone: TONE.warning },
  },
  req_check_failed: {
    enterprise: { label: "Requirement check — failed", tone: TONE.error },
    mentor: { label: "Rejected", tone: TONE.error, history: true },
    reviewer: dash(),
    contributor: { label: "Requirement check failed", tone: TONE.error },
  },
  qa_review_pending: {
    enterprise: { label: "QA review (with reviewer)", tone: TONE.info },
    // Mentor accepted; the QA reviewer has NOT decided yet. Was "Accepted → QA
    // review" in green, which read as "QA accepted it".
    mentor: { label: "You accepted · awaiting QA review", tone: TONE.info, history: true },
    reviewer: { label: "In my queue — pending", tone: TONE.info },
    contributor: { label: "Requirement check accepted · QA review pending", tone: TONE.info },
  },
  qa_review_rework: {
    enterprise: { label: "QA review — rework", tone: TONE.warning },
    mentor: { label: "QA sent back for rework", tone: TONE.warning, history: true },
    reviewer: { label: "Returned for rework", tone: TONE.warning, history: true },
    contributor: { label: "Rework needed · QA review", tone: TONE.warning },
  },
  qa_review_failed: {
    enterprise: { label: "QA review — failed", tone: TONE.error },
    mentor: { label: "QA rejected", tone: TONE.error, history: true },
    reviewer: { label: "Rejected", tone: TONE.error, history: true },
    contributor: { label: "QA review failed", tone: TONE.error },
  },
  payment_pending: {
    enterprise: { label: "QA accepted · Payment pending", tone: TONE.warning },
    mentor: { label: "Completed", tone: TONE.success, history: true },
    reviewer: { label: "QA accepted", tone: TONE.success, history: true },
    contributor: { label: "QA review accepted · Payment pending", tone: TONE.warning },
  },
  paid: {
    enterprise: { label: "Completed · Paid", tone: TONE.success },
    mentor: { label: "Completed", tone: TONE.success, history: true },
    reviewer: { label: "Completed", tone: TONE.success, history: true },
    contributor: { label: "Successfully completed — paid", tone: TONE.success },
  },
  declined: {
    enterprise: { label: "Declined — reassign", tone: TONE.error },
    mentor: dash(),
    reviewer: dash(),
    contributor: { label: "Declined", tone: TONE.neutral },
  },
  cancelled: {
    enterprise: { label: "Cancelled", tone: TONE.neutral },
    mentor: { label: "Cancelled", tone: TONE.neutral, history: true },
    reviewer: { label: "Cancelled", tone: TONE.neutral, history: true },
    contributor: { label: "Cancelled", tone: TONE.neutral },
  },
};

/**
 * Legacy / coarse status codes still present on older rows, mapped to the
 * canonical granular code so they keep rendering correctly.
 */
const LEGACY_ALIAS: Record<string, DeliveryStatus> = {
  pending: "ready",
  open: "ready",
  matched: "ready",
  submitted: "req_check_pending",
  in_review: "req_check_pending",
  requirement_check: "req_check_pending",
  qa_review: "qa_review_pending",
  quality_check: "qa_review_pending",
  revision: "req_check_rework",
  rework: "req_check_rework",
  feedback_requested: "req_check_rework",
  rejected: "req_check_failed",
  awaiting_acceptance: "payment_pending",
  accepted: "payment_pending",
  completed: "paid",
  done: "paid",
};

export function normalizeDeliveryStatus(raw?: string | null): DeliveryStatus | null {
  if (!raw) return null;
  const key = String(raw).trim().toLowerCase();
  if (key in DELIVERY_MATRIX) return key as DeliveryStatus;
  if (key in LEGACY_ALIAS) return LEGACY_ALIAS[key];
  return null;
}

/** Resolve the {label, tone, history} cell for a given status + role. */
export function deliveryCell(raw: string | null | undefined, role: DeliveryRole): DeliveryCell {
  const status = normalizeDeliveryStatus(raw);
  if (status) {
    const cell = DELIVERY_MATRIX[status][role];
    if (cell.label) return cell;
  }
  // Fallback: humanize the raw code so nothing renders blank.
  const human = (raw || "—").toString().replace(/_/g, " ");
  return { label: human.charAt(0).toUpperCase() + human.slice(1), tone: TONE.neutral };
}

/** Convenience: just the role-facing label string. */
export function deliveryLabel(raw: string | null | undefined, role: DeliveryRole): string {
  return deliveryCell(raw, role).label ?? "—";
}

/**
 * Derive the canonical delivery status from a MENTOR's own review row
 * (decision + status), so the mentor queue/history can render its column of the
 * matrix without the backend having to join the decomposition task.
 */
export function mentorReviewStatus(
  decision?: string | null,
  status?: string | null,
): DeliveryStatus {
  const d = (decision || "").toLowerCase();
  const s = (status || "").toLowerCase();
  if (d === "accept" || s === "accepted") return "qa_review_pending"; // → "Accepted → QA review"
  if (d === "rework" || s === "rework") return "req_check_rework";
  if (d === "reject" || s === "rejected") return "req_check_failed";
  return "req_check_pending"; // pending / in_review / escalated → in my queue
}

/**
 * Derive the canonical delivery status from a REVIEWER's own assignment row
 * (status + decision).
 */
export function reviewerAssignmentStatus(
  status?: string | null,
  decision?: string | null,
): DeliveryStatus {
  const s = (status || decision || "").toLowerCase();
  if (["approved", "completed", "accepted", "decided_accept"].includes(s)) return "payment_pending"; // "QA accepted"
  if (["rework", "revision", "request_rework", "decided_rework"].includes(s)) return "qa_review_rework";
  if (["rejected", "decided_reject"].includes(s)) return "qa_review_failed";
  return "qa_review_pending"; // pending → in my queue
}
