/**
 * Delivery Tracking v3 types — 5-role propagation lifecycle + orthogonal
 * severity states. A "delivery" here is a Task moving through the org's
 * cross-role workflow: Contributor → Mentor → Reviewer → Enterprise →
 * Billing. Severity rides on top of role (e.g. a delivery in Mentor
 * review can be "flowing" or "breach" independently).
 */

export type DeliveryStage =
  | "contributor"
  | "mentor"
  | "reviewer"
  | "enterprise"
  | "billing";

export type SeverityState =
  | "flowing"
  | "slow"
  | "breach"
  | "blocked"
  | "escalated";

export type InterventionKind =
  | "reassigned"
  | "sla_overridden"
  | "convened"
  | "held"
  | "released"
  | "escalated"
  | "withdrawn";

export interface InterventionRecord {
  id: string;
  taskId: string;
  stage: DeliveryStage;
  kind: InterventionKind;
  at: string;
  actor: string;
  /** Optional second actor for override / co-sign flows. */
  cosignActor?: string;
  note?: string;
}

export type DeliveryAuditKind =
  | "stage_entered"
  | "stage_left"
  | "reassigned"
  | "sla_overridden"
  | "convened"
  | "held"
  | "released"
  | "escalated"
  | "escalation_resolved"
  | "edited";

export interface DeliveryAuditEntry {
  id: string;
  at: string;
  taskId: string;
  stage?: DeliveryStage;
  kind: DeliveryAuditKind;
  actor: string;
  detail?: string;
}

export type ActivityEventKind =
  | "submission"
  | "mentor_decision"
  | "reviewer_decision"
  | "enterprise_decision"
  | "billing_unlocked"
  | "reassignment"
  | "hold"
  | "release"
  | "escalation"
  | "throughput_milestone"
  | "sla_breach";

export interface ActivityEvent {
  id: string;
  at: string;
  kind: ActivityEventKind;
  /** Plain-language headline rendered in the feed. */
  title: string;
  /** Sub-line — owner / round / amount, etc. */
  detail: string;
  /** Role chip(s) shown beside the row. */
  stages: DeliveryStage[];
  /** Linked task id when applicable. */
  taskId?: string;
  /** Tone for the leading dot. */
  tone: "flowing" | "slow" | "breach" | "blocked" | "neutral";
}

export interface DeliveryMetadata {
  taskId: string;
  /** Persisted intervention history per task. */
  interventions: InterventionRecord[];
  /** Optional manual SLA override (hours). */
  slaOverrideHours?: number;
  /** Active hold record (if any). */
  hold?: {
    raisedAt: string;
    raisedBy: string;
    reason: string;
    releasedAt?: string;
    releasedBy?: string;
  };
  audit: DeliveryAuditEntry[];
}

/** Per-stage SLA window in hours (operator-overridable in the store). */
export const DEFAULT_SLA_HOURS: Record<DeliveryStage, number> = {
  contributor: 5 * 24,
  mentor: 48,
  reviewer: 24,
  enterprise: 48,
  billing: 7 * 24,
};

export interface StageDef {
  id: DeliveryStage;
  label: string;
  sub: string;
}

export const DELIVERY_STAGES: StageDef[] = [
  { id: "contributor", label: "Contributor", sub: "Active work" },
  { id: "mentor", label: "Mentor", sub: "Mentor review" },
  { id: "reviewer", label: "Reviewer", sub: "Reviewer validation" },
  { id: "enterprise", label: "Enterprise", sub: "Acceptance" },
  { id: "billing", label: "Billing", sub: "Eligible" },
];
