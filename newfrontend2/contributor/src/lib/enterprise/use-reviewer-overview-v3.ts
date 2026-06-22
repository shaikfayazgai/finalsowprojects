"use client";

import * as React from "react";
import {
  useContributorTasksStore,
  type Task,
} from "@/lib/stores/contributor-tasks-store";
import { useReviewerStoreV3 } from "@/lib/stores/reviewer-store-v3";
import type {
  EvidenceVerification,
  RecommendationRecord,
  ReviewerAuditEntry,
  ReviewerEscalation,
  ReviewerHold,
  ValidationFlag,
  ValidationPhase,
} from "@/types/reviewer";

const SLA_HOURS_BREACH = 48;
const SLA_HOURS_WATCH = 24;

export interface ValidationRowV3 {
  task: Task;
  hoursInQueue: number;
  daysSinceLastMovement: number;
  criteriaAddressed: number;
  criteriaTotal: number;
  correctionsResolved: number;
  correctionsTotal: number;
  evidenceCount: number;
  completenessPct: number;
  readinessScore: number;
  slaStatus: "ok" | "watch" | "breach";
  rounds: number;

  // Derived from V3 metadata overrides
  phase: ValidationPhase;
  flags: ValidationFlag[];
  evidence: EvidenceVerification;
  recommendation?: RecommendationRecord;
  escalations: ReviewerEscalation[];
  unresolvedEscalations: number;
  hold?: ReviewerHold;
  reviewerInitials?: string;
  audit: ReviewerAuditEntry[];
}

export interface ReviewerOverviewV3 {
  rows: ValidationRowV3[];
  recentlyValidated: ValidationRowV3[];

  // KPIs
  pendingCount: number;
  readyCount: number;
  inValidationCount: number;
  freshCount: number;
  mentorRevisitCount: number;
  escalationCount: number;
  unresolvedEscalations: number;
  slaPressureCount: number;
  slaBreachCount: number;
  holdCount: number;
  validatedThisCycle: number;
  medianCompleteness: number;
  avgConfidence: number;
}

function hoursSince(raw: string | undefined): number {
  if (!raw) return 0;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return 0;
  return Math.max(0, Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60)));
}

function daysSince(raw: string | undefined): number {
  if (!raw) return 0;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return 0;
  return Math.max(0, Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)));
}

function derivePhase(
  meta: { phase?: ValidationPhase },
  computed: {
    escalations: number;
    hold: boolean;
    readinessScore: number;
    completenessPct: number;
    correctionsTotal: number;
    correctionsResolved: number;
  },
): ValidationPhase {
  if (meta.phase) return meta.phase;
  if (computed.hold) return "hold";
  if (computed.escalations > 0) return "escalation";
  if (
    computed.correctionsTotal > 0 &&
    computed.correctionsResolved < computed.correctionsTotal
  ) {
    return "mentor_revisit";
  }
  if (computed.readinessScore >= 90) return "ready_for_enterprise";
  if (computed.completenessPct >= 80) return "in_validation";
  return "fresh";
}

export function useReviewerOverviewV3(): ReviewerOverviewV3 {
  const tasksById = useContributorTasksStore((s) => s.tasksById);
  const metaById = useReviewerStoreV3((s) => s.metaById);

  return React.useMemo(() => {
    const allTasks = Object.values(tasksById);
    const lane = allTasks.filter(
      (t) => t.state === "completed" && !t.enterpriseAccepted,
    );

    const rows: ValidationRowV3[] = lane.map((t) => buildRow(t, metaById[t.id]));

    rows.sort((a, b) => {
      const score = (r: ValidationRowV3) =>
        (r.phase === "escalation" ? 1000 : 0) +
        r.unresolvedEscalations * 200 +
        (r.slaStatus === "breach" ? 120 : r.slaStatus === "watch" ? 40 : 0) +
        r.hoursInQueue;
      return score(b) - score(a);
    });

    const recentlyValidated: ValidationRowV3[] = allTasks
      .filter(
        (t) =>
          (t.state === "approved" || (t.state === "completed" && t.enterpriseAccepted)) &&
          !!t.enterpriseDecisionAt,
      )
      .map((t) => buildRow(t, metaById[t.id]))
      .sort((a, b) => {
        const da = new Date(a.task.enterpriseDecisionAt ?? 0).getTime();
        const db = new Date(b.task.enterpriseDecisionAt ?? 0).getTime();
        return db - da;
      })
      .slice(0, 8);

    const readyCount = rows.filter((r) => r.phase === "ready_for_enterprise").length;
    const inValidationCount = rows.filter((r) => r.phase === "in_validation").length;
    const freshCount = rows.filter((r) => r.phase === "fresh").length;
    const mentorRevisitCount = rows.filter((r) => r.phase === "mentor_revisit").length;
    const escalationCount = rows.filter((r) => r.phase === "escalation").length;
    const unresolvedEscalations = rows.reduce(
      (acc, r) => acc + r.unresolvedEscalations,
      0,
    );
    const slaPressureCount = rows.filter(
      (r) => r.slaStatus === "watch" || r.slaStatus === "breach",
    ).length;
    const slaBreachCount = rows.filter((r) => r.slaStatus === "breach").length;
    const holdCount = rows.filter((r) => !!r.hold && !r.hold.releasedAt).length;

    const medianCompleteness =
      rows.length === 0
        ? 0
        : Math.round(
            [...rows].sort((a, b) => a.completenessPct - b.completenessPct)[
              Math.floor(rows.length / 2)
            ].completenessPct,
          );

    const confidenceSamples = rows
      .map((r) => r.recommendation?.confidence)
      .filter((c): c is number => typeof c === "number");
    const avgConfidence =
      confidenceSamples.length === 0
        ? 0
        : Math.round(
            confidenceSamples.reduce((a, b) => a + b, 0) / confidenceSamples.length,
          );

    return {
      rows,
      recentlyValidated,
      pendingCount: rows.length,
      readyCount,
      inValidationCount,
      freshCount,
      mentorRevisitCount,
      escalationCount,
      unresolvedEscalations,
      slaPressureCount,
      slaBreachCount,
      holdCount,
      validatedThisCycle: recentlyValidated.length,
      medianCompleteness,
      avgConfidence,
    };
  }, [tasksById, metaById]);
}

function buildRow(t: Task, meta?: import("@/types/reviewer").ValidationMetadata): ValidationRowV3 {
  const arrived = t.acceptanceArrivedAt ?? t.acceptedAt ?? t.lastActivityAt;
  const hoursInQueue = hoursSince(arrived);
  const daysSinceLastMovement = daysSince(t.lastActivityAt);

  const slaStatus: ValidationRowV3["slaStatus"] =
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

  const criteriaPct = criteriaTotal > 0 ? criteriaAddressed / criteriaTotal : 1;
  const correctionPct = correctionsTotal > 0 ? correctionsResolved / correctionsTotal : 1;
  const evidencePct = evidenceCount > 0 ? 1 : 0;
  const completenessPct = Math.round(
    (criteriaPct * 0.5 + correctionPct * 0.3 + evidencePct * 0.2) * 100,
  );

  const slaPenalty = slaStatus === "breach" ? 15 : slaStatus === "watch" ? 5 : 0;
  const readinessScore = Math.max(
    0,
    Math.min(100, Math.round(completenessPct * 0.6 + (t.readinessScore ?? 0) * 0.4 - slaPenalty)),
  );

  const escalations = meta?.escalations ?? [];
  const unresolvedEscalations = escalations.filter((e) => !e.resolvedAt).length;
  const holdActive = !!meta?.hold && !meta.hold.releasedAt;

  const phase = derivePhase(meta ?? {}, {
    escalations: unresolvedEscalations,
    hold: holdActive,
    readinessScore,
    completenessPct,
    correctionsTotal,
    correctionsResolved,
  });

  return {
    task: t,
    hoursInQueue,
    daysSinceLastMovement,
    criteriaAddressed,
    criteriaTotal,
    correctionsResolved,
    correctionsTotal,
    evidenceCount,
    completenessPct,
    readinessScore,
    slaStatus,
    rounds: t.reworkRound ?? 1,

    phase,
    flags: meta?.flags ?? [],
    evidence: meta?.evidence ?? {},
    recommendation: meta?.recommendation,
    escalations,
    unresolvedEscalations,
    hold: meta?.hold,
    reviewerInitials: meta?.reviewerInitials,
    audit: meta?.audit ?? [],
  };
}
