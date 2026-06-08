/**
 * Contributor Portal V2 — Revisions workspace mock.
 *
 * Powers `/contributor/tasks/revisions` — the real operational revision
 * management workspace (not a placeholder).
 *
 * Each row is a task that requires correction. Rich enough to drive the
 * cross-revision queue, the selected revision's detail preview, and the
 * AI cross-revision helper.
 *
 * Frontend-only. Backend integration is Phase 2+.
 */

export type RevisionWorkflowState =
  | "feedback_received"
  | "in_correction"
  | "awaiting_clarification"
  | "ready_for_resubmission"
  | "resubmitted_under_review";

export interface RevisionCorrection {
  id: string;
  criterion: string;
  description: string;
  severity: "blocker" | "major" | "nit";
  category: "Functionality" | "Quality" | "Accessibility" | "Testing" | "Docs" | "Requirements";
  resolved: boolean;
  evidenceRef?: string;
  blockedBy?: string;
}

export interface RevisionEvidenceDelta {
  id: string;
  label: string;
  kind: "deliverable" | "evidence" | "criterion";
  previous: "missing" | "partial" | "present";
  updated: "missing" | "partial" | "present";
  note?: string;
}

export interface RevisionClarificationMessage {
  id: string;
  author: string;
  authorRole: "mentor" | "contributor" | "system";
  body: string;
  at: string;
}

export interface RevisionClarification {
  status: "pending" | "answered" | "resolved";
  raisedBy: "mentor" | "contributor";
  pauseSla: boolean;
  expectedBy?: string;
  messages: RevisionClarificationMessage[];
}

export interface RevisionAiHint {
  id: string;
  correctionId?: string;
  title: string;
  detail: string;
  confidence: "high" | "medium" | "low";
  source: string;
}

export interface RevisionActivityEvent {
  id: string;
  at: string;
  kind:
    | "feedback_received"
    | "correction_resolved"
    | "clarification_sent"
    | "clarification_replied"
    | "draft_saved"
    | "evidence_uploaded"
    | "resubmitted";
  taskId: string;
  detail: string;
  mentor?: string;
}

export interface RevisionRow {
  id: string;
  taskId: string;
  title: string;
  shortDescription: string;
  project: string;
  portfolio: string;
  priority: "P0" | "P1" | "P2";
  skill: string;

  state: RevisionWorkflowState;
  reworkRound: number;
  totalRounds: number;
  feedbackReceivedAt: string;
  dueAt: string;
  hoursToDue: number;
  lastActivityAt: string;

  mentor: { name: string; initials: string; role: string };

  whatWorked: string;
  mentorGuidance: string;
  corrections: RevisionCorrection[];
  optionalSuggestions: string[];

  evidenceDeltas: RevisionEvidenceDelta[];
  draftNote?: string;
  draftSavedAt?: string;

  clarification?: RevisionClarification;

  aiHints: RevisionAiHint[];
  readinessScore: number;
  nextRequiredAction: string;
  payoutAmount: string;
}

/* ─────────────────────── Canonical mock rows ─────────────────────── */

export const revisionRows: RevisionRow[] = [];

/* ─────────────────────── Activity stream ─────────────────────── */

export const revisionActivityStream: RevisionActivityEvent[] = [];

/* ─────────────────────── Helpers ─────────────────────── */

export function stateTone(state: RevisionWorkflowState): { chip: string; dot: string; label: string } {
  switch (state) {
    case "feedback_received":
      return {
        chip: "border-gold-200 bg-gold-50 text-gold-800",
        dot: "bg-gold-500",
        label: "Feedback received",
      };
    case "in_correction":
      return {
        chip: "border-teal-200 bg-teal-50 text-teal-800",
        dot: "bg-teal-600",
        label: "In correction",
      };
    case "awaiting_clarification":
      return {
        chip: "border-gold-200 bg-gold-50 text-gold-800",
        dot: "bg-gold-500",
        label: "Awaiting clarification",
      };
    case "ready_for_resubmission":
      return {
        chip: "border-forest-200 bg-forest-50 text-forest-800",
        dot: "bg-forest-500",
        label: "Ready to resubmit",
      };
    case "resubmitted_under_review":
      return {
        chip: "border-beige-200 bg-beige-50 text-beige-700",
        dot: "bg-beige-500",
        label: "Under review",
      };
  }
}

export function formatHoursToDue(hoursToDue: number): string {
  if (hoursToDue < 0) return "Resubmitted";
  if (hoursToDue === 0) return "Due now";
  if (hoursToDue < 24) return `${hoursToDue}h left`;
  return `${Math.floor(hoursToDue / 24)}d ${hoursToDue % 24}h`;
}

export function correctionStats(r: RevisionRow): {
  total: number;
  resolved: number;
  unresolved: number;
  pct: number;
} {
  const total = r.corrections.length;
  const resolved = r.corrections.filter((c) => c.resolved).length;
  return {
    total,
    resolved,
    unresolved: total - resolved,
    pct: total === 0 ? 0 : Math.round((resolved / total) * 100),
  };
}

export function severityTone(s: RevisionCorrection["severity"]): { chip: string; label: string } {
  switch (s) {
    case "blocker":
      return { chip: "border-brown-300 bg-brown-50 text-brown-800", label: "Must fix" };
    case "major":
      return { chip: "border-gold-200 bg-gold-50 text-gold-800", label: "Required" };
    case "nit":
      return { chip: "border-beige-200 bg-beige-50 text-beige-700", label: "Polish" };
  }
}

export function urgencyOf(r: RevisionRow): "due_today" | "due_soon" | "comfortable" | "submitted" {
  if (r.state === "resubmitted_under_review") return "submitted";
  if (r.hoursToDue <= 24) return "due_today";
  if (r.hoursToDue <= 48) return "due_soon";
  return "comfortable";
}
