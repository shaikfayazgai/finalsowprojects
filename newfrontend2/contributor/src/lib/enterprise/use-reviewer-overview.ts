/**
 * Enterprise V2 — Reviewer Workspace overview hook.
 *
 * The Reviewer role sits between mentor governance and enterprise
 * acceptance. They do NOT decide — that authority belongs to the
 * enterprise buyer (Enterprise Review V2). The reviewer's job is:
 *
 *   - validate evidence completeness
 *   - verify the delivery package against acceptance criteria
 *   - flag escalation-worthy anomalies
 *   - prepare deliveries for enterprise sign-off
 *
 * This hook derives a "validation queue" from the same underlying
 * acceptance candidates Enterprise Review reads, then adds
 * reviewer-specific compute: completeness pct, validation readiness
 * score, and prioritization.
 */

"use client";

import * as React from "react";
import {
  useContributorTasksStore,
  type Task,
} from "@/lib/stores/contributor-tasks-store";

export type ValidationStatus =
  | "fresh"
  | "in_validation"
  | "ready_for_enterprise"
  | "escalation_flagged"
  | "validated";

export interface ValidationRow {
  task: Task;
  /** Hours since the delivery arrived in the validation lane. */
  hoursInQueue: number;
  /** Acceptance criteria addressed / total. */
  criteriaAddressed: number;
  criteriaTotal: number;
  /** Mentor corrections resolved / total. */
  correctionsResolved: number;
  correctionsTotal: number;
  /** Count of attached evidence artifacts. */
  evidenceCount: number;
  /** Completeness percentage = criteria + corrections + evidence presence. */
  completenessPct: number;
  /** Validation readiness score, 0–100 (composite). */
  readinessScore: number;
  /** Whether SLA pressure is active. */
  slaStatus: "ok" | "watch" | "breach";
  /** Number of escalation triggers detected for this row. */
  escalationFlags: number;
  /** Synthesized review status (transient — not persisted). */
  status: ValidationStatus;
  /** Submission rounds the contributor went through to reach here. */
  rounds: number;
}

export interface ReviewerOverview {
  /** All deliveries currently in the validation lane. */
  queue: ValidationRow[];
  /** Recently validated deliveries (mock — last few accepted by enterprise). */
  recentlyValidated: ValidationRow[];

  // Header KPIs
  inValidation: number;
  readyForEnterprise: number;
  escalationFlagged: number;
  slaSensitive: number;
  validatedThisCycle: number;
  /** Median completeness across the active queue. */
  medianCompleteness: number;
}

const SLA_HOURS_BREACH = 48;
const SLA_HOURS_WATCH = 24;

function hoursSince(raw: string | undefined): number {
  if (!raw) return 0;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return 0;
  return Math.max(0, Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60)));
}

function deriveStatus(row: Omit<ValidationRow, "status">): ValidationStatus {
  if (row.escalationFlags > 0) return "escalation_flagged";
  if (row.readinessScore >= 90) return "ready_for_enterprise";
  if (row.completenessPct >= 80) return "in_validation";
  return "fresh";
}

function buildRow(t: Task): ValidationRow {
  const arrived =
    t.acceptanceArrivedAt ?? t.acceptedAt ?? t.lastActivityAt;
  const hoursInQueue = hoursSince(arrived);
  const slaStatus: ValidationRow["slaStatus"] =
    hoursInQueue >= SLA_HOURS_BREACH
      ? "breach"
      : hoursInQueue >= SLA_HOURS_WATCH
      ? "watch"
      : "ok";

  const criteria = t.acceptanceCriteria ?? [];
  const criteriaAddressed = criteria.filter((c) => c.addressed).length;
  const criteriaTotal = criteria.length;

  const corrections = t.mentorFeedback?.requiredCorrections ?? [];
  const correctionsResolved = corrections.filter((c) => c.addressed).length;
  const correctionsTotal = corrections.length;

  const evidenceCount = (t.evidence ?? []).length;

  // Composite completeness: criteria coverage (50%), correction closure (30%), evidence presence (20%)
  const criteriaPct = criteriaTotal > 0 ? criteriaAddressed / criteriaTotal : 1;
  const correctionPct = correctionsTotal > 0 ? correctionsResolved / correctionsTotal : 1;
  const evidencePct = evidenceCount > 0 ? 1 : 0;
  const completenessPct = Math.round(
    (criteriaPct * 0.5 + correctionPct * 0.3 + evidencePct * 0.2) * 100,
  );

  // Readiness blends completeness + the task's own readinessScore (mentor-set) and penalizes SLA breach
  const slaPenalty = slaStatus === "breach" ? 15 : slaStatus === "watch" ? 5 : 0;
  const readinessScore = Math.max(
    0,
    Math.min(
      100,
      Math.round((completenessPct * 0.6 + t.readinessScore * 0.4) - slaPenalty),
    ),
  );

  // Escalation flags = unresolved blocker-severity corrections + SLA breach + extreme rounds
  const unresolvedBlockers = corrections.filter(
    (c) => c.severity === "blocker" && !c.addressed,
  ).length;
  const escalationFlags =
    unresolvedBlockers + (slaStatus === "breach" ? 1 : 0) + (t.reworkRound >= 3 ? 1 : 0);

  const base = {
    task: t,
    hoursInQueue,
    criteriaAddressed,
    criteriaTotal,
    correctionsResolved,
    correctionsTotal,
    evidenceCount,
    completenessPct,
    readinessScore,
    slaStatus,
    escalationFlags,
    rounds: t.reworkRound,
  };
  return { ...base, status: deriveStatus(base) };
}

export function useReviewerOverview(): ReviewerOverview {
  const tasksById = useContributorTasksStore((s) => s.tasksById);

  return React.useMemo(() => {
    const tasks = Object.values(tasksById);

    // Validation lane: mentor cleared, enterprise has NOT yet accepted
    const lane = tasks.filter(
      (t) => t.state === "completed" && !t.enterpriseAccepted,
    );

    const queue: ValidationRow[] = lane
      .map(buildRow)
      .sort((a, b) => {
        // Escalations float to the top, then SLA pressure, then oldest in queue
        const score = (r: ValidationRow) =>
          r.escalationFlags * 100 +
          (r.slaStatus === "breach" ? 50 : r.slaStatus === "watch" ? 20 : 0) +
          r.hoursInQueue;
        return score(b) - score(a);
      });

    // Recently validated = enterprise-accepted tasks (closed lifecycle)
    const recentlyValidated: ValidationRow[] = tasks
      .filter(
        (t) =>
          (t.state === "approved" || (t.state === "completed" && t.enterpriseAccepted)) &&
          !!t.enterpriseDecisionAt,
      )
      .map(buildRow)
      .sort((a, b) => {
        const da = new Date(a.task.enterpriseDecisionAt ?? 0).getTime();
        const db = new Date(b.task.enterpriseDecisionAt ?? 0).getTime();
        return db - da;
      })
      .slice(0, 6);

    const escalationFlagged = queue.filter((r) => r.status === "escalation_flagged").length;
    const readyForEnterprise = queue.filter((r) => r.status === "ready_for_enterprise").length;
    const slaSensitive = queue.filter(
      (r) => r.slaStatus === "watch" || r.slaStatus === "breach",
    ).length;

    const medianCompleteness =
      queue.length > 0
        ? Math.round(
            [...queue].sort((a, b) => a.completenessPct - b.completenessPct)[
              Math.floor(queue.length / 2)
            ].completenessPct,
          )
        : 0;

    return {
      queue,
      recentlyValidated,
      inValidation: queue.length,
      readyForEnterprise,
      escalationFlagged,
      slaSensitive,
      validatedThisCycle: recentlyValidated.length,
      medianCompleteness,
    };
  }, [tasksById]);
}

/* ─────────────────────── Tone helpers ─────────────────────── */

export function validationStatusTone(s: ValidationStatus): {
  chip: string;
  ring: string;
  tint: string;
  label: string;
} {
  switch (s) {
    case "fresh":
      return {
        chip: "border-beige-200 bg-beige-50 text-beige-700",
        ring: "ring-beige-200 bg-beige-50",
        tint: "text-beige-700",
        label: "Fresh",
      };
    case "in_validation":
      return {
        chip: "border-teal-200 bg-teal-50 text-teal-700",
        ring: "ring-teal-200 bg-teal-50",
        tint: "text-teal-700",
        label: "In validation",
      };
    case "ready_for_enterprise":
      return {
        chip: "border-forest-200 bg-forest-50 text-forest-700",
        ring: "ring-forest-200 bg-forest-50",
        tint: "text-forest-700",
        label: "Ready for enterprise",
      };
    case "escalation_flagged":
      return {
        chip: "border-brown-300 bg-brown-50 text-brown-800",
        ring: "ring-brown-200 bg-brown-50",
        tint: "text-brown-800",
        label: "Escalation flagged",
      };
    case "validated":
      return {
        chip: "border-forest-200 bg-forest-50 text-forest-700",
        ring: "ring-forest-200 bg-forest-50",
        tint: "text-forest-700",
        label: "Validated",
      };
  }
}
