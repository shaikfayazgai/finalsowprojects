/**
 * SOW v3 overview — single canonical 7-state lifecycle + orthogonal
 * 4-gate matrix. Derives from the legacy mock (`enterpriseSows`) and
 * merges persisted overrides from `useSowStoreV3`.
 *
 * Mapping legacy → v3:
 *   draft        → intake
 *   in_review    → scoped
 *   approval     → pending_approval
 *   approved     → approved
 *   decomposing  → decomposing
 *   in_delivery  → delivering
 *   completed    → completed
 *
 * Legacy gates → v3 gates: { business, glimmora_commercial, legal, security }
 * (`final` is dropped — approval = all four gates approved).
 */

"use client";

import * as React from "react";
import {
  enterpriseSows,
  type EnterpriseSow,
  type SowApprovalGate,
  type SowState as LegacySowState,
} from "@/mocks/data/enterprise-v2-orchestration";
import { useSowStoreV3 } from "@/lib/stores/sow-store-v3";
import type {
  ApprovalGate,
  ApprovalGateId,
  EscalationRecord,
  SowAuditEntry,
  SowHold,
  SowState,
} from "@/types/sow";

const LEGACY_TO_V3: Record<LegacySowState, SowState> = {
  draft: "intake",
  in_review: "scoped",
  approval: "pending_approval",
  approved: "approved",
  decomposing: "decomposing",
  in_delivery: "delivering",
  completed: "completed",
};

const GATE_LABELS: Record<ApprovalGateId, string> = {
  business: "Finance",
  commercial: "Commercial",
  legal: "Legal",
  security: "Security",
};

// Default approvers per gate — used when the legacy mock doesn't seed one.
const DEFAULT_APPROVERS: Record<
  ApprovalGateId,
  { name: string; initials: string }
> = {
  business: { name: "Jordan Park", initials: "JP" },
  commercial: { name: "Kavi Singh", initials: "KS" },
  legal: { name: "Lara Hammond", initials: "LH" },
  security: { name: "Maya Chen", initials: "MC" },
};

const STALE_DAYS = 5;
const STALE_WORKFLOW_DAYS = 14;

function gateStateFromLegacy(g?: SowApprovalGate): ApprovalGate["state"] {
  if (!g) return "pending";
  if (g.status === "blocked") return "rejected";
  if (g.status === "approved") return "approved";
  if (g.status === "in_review") return "in_review";
  return "pending";
}

function daysSince(raw?: string): number {
  if (!raw) return 0;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000));
}

export interface SowV3 {
  raw: EnterpriseSow;
  state: SowState;
  gates: ApprovalGate[];
  escalations: EscalationRecord[];
  hold?: SowHold;
  audit: SowAuditEntry[];
  /** Days since last lifecycle transition. */
  daysInState: number;
  /** Convenience flags. */
  stale: boolean;
  deadlock: boolean;
  /** AI confidence percentage from observations (0–100). */
  aiConfidence: number;
}

export interface SowOverview {
  sows: SowV3[];
  counts: Record<SowState, number>;
  pendingApprovalCount: number;
  staleApprovalCount: number;
  staleWorkflowCount: number;
  escalationCount: number;
  deadlockCount: number;
  holdCount: number;
  totalBudgetCents: number;
  totalCommittedCents: number;
}

function deriveSow(
  raw: EnterpriseSow,
  metaById: ReturnType<typeof useSowStoreV3.getState>["metaById"],
): SowV3 {
  const meta = metaById[raw.id];
  const v3State: SowState = meta?.state ?? LEGACY_TO_V3[raw.state];

  // Build gate list: prefer store overrides, fall back to legacy mock.
  const gates: ApprovalGate[] = (
    ["business", "legal", "security", "commercial"] as ApprovalGateId[]
  ).map((id) => {
    const storeGate = meta?.gates.find((g) => g.id === id);
    if (storeGate) return storeGate;

    const legacyStage =
      id === "commercial" ? "glimmora_commercial" : id;
    const legacyGate = raw.approvalStages.find(
      (s) => s.stage === legacyStage,
    );
    const approver = DEFAULT_APPROVERS[id];
    return {
      id,
      label: GATE_LABELS[id],
      approverName: approver.name,
      approverInitials: approver.initials,
      state: gateStateFromLegacy(legacyGate),
      decidedAt: legacyGate?.decidedAt,
      note: undefined,
      daysInState: daysSince(legacyGate?.decidedAt ?? raw.createdAt),
      approverActiveCount: 0,
    };
  });

  // Stage anchor — for daysInState computation
  const anchor =
    v3State === "approved"
      ? meta?.approvedAt ?? raw.approvedAt
      : v3State === "completed"
        ? meta?.completedAt
        : v3State === "pending_approval"
          ? meta?.submittedAt ?? raw.createdAt
          : raw.createdAt;
  const daysInState = daysSince(anchor);

  // AI confidence — average across legacy observations
  // Legacy `confidence` is a string literal (high/medium/low); map to percentages and average.
  const aiConfidence = raw.aiObservations.length
    ? Math.round(
        raw.aiObservations.reduce(
          (a, o) =>
            a + (o.confidence === "high" ? 92 : o.confidence === "medium" ? 72 : 48),
          0,
        ) / raw.aiObservations.length,
      )
    : 80;

  const rejected = gates.filter((g) => g.state === "rejected").length;
  const stalePending = gates.some(
    (g) =>
      (g.state === "pending" || g.state === "in_review") &&
      g.daysInState >= STALE_DAYS,
  );
  const deadlock = rejected >= 2;
  const stale =
    daysInState >= STALE_WORKFLOW_DAYS ||
    (v3State === "pending_approval" && stalePending);

  return {
    raw,
    state: v3State,
    gates,
    escalations: meta?.escalations ?? [],
    hold: meta?.hold,
    audit: meta?.audit ?? [],
    daysInState,
    stale,
    deadlock,
    aiConfidence,
  };
}

export function useSowOverviewV3(): SowOverview {
  const metaById = useSowStoreV3((s) => s.metaById);

  return React.useMemo(() => {
    const sows = enterpriseSows.map((raw) => deriveSow(raw, metaById));

    const counts: Record<SowState, number> = {
      intake: 0,
      scoped: 0,
      pending_approval: 0,
      approved: 0,
      decomposing: 0,
      delivering: 0,
      completed: 0,
    };
    sows.forEach((s) => {
      counts[s.state] += 1;
    });

    const pendingApprovalCount = counts.pending_approval;
    const staleApprovalCount = sows.filter(
      (s) => s.state === "pending_approval" && s.stale,
    ).length;
    const staleWorkflowCount = sows.filter(
      (s) => s.daysInState >= STALE_WORKFLOW_DAYS,
    ).length;
    const escalationCount = sows.filter(
      (s) => s.escalations.some((e) => !e.resolvedAt),
    ).length;
    const deadlockCount = sows.filter((s) => s.deadlock).length;
    const holdCount = sows.filter((s) => !!s.hold && !s.hold.releasedAt).length;

    const totalBudgetCents = sows.reduce((a, s) => a + s.raw.budget, 0);
    const totalCommittedCents = sows.reduce((a, s) => a + s.raw.committed, 0);

    return {
      sows,
      counts,
      pendingApprovalCount,
      staleApprovalCount,
      staleWorkflowCount,
      escalationCount,
      deadlockCount,
      holdCount,
      totalBudgetCents,
      totalCommittedCents,
    };
  }, [metaById]);
}
