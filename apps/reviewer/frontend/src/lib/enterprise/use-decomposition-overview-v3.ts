/**
 * Decomposition v3 overview — single canonical 7-state lifecycle + 3-gate
 * matrix. Derives from `decompositionPlans` + `enterpriseSows` mocks and
 * merges persisted overrides from `useDecompStoreV3`.
 *
 * Legacy → v3 mapping:
 *   not_started      → drafting
 *   drafting         → scoped (when readiness > 0)
 *   ready_for_commit → pending_approval
 *   committed        → approved (or decomposed if tasks seeded)
 *   in_delivery      → in_delivery
 */

"use client";

import * as React from "react";
import {
  decompositionPlans,
  type DecompositionPlan,
} from "@/mocks/data/enterprise-decomposition";
import {
  enterpriseSows,
  type EnterpriseSow,
} from "@/mocks/data/enterprise-v2-orchestration";
import { useDecompStoreV3 } from "@/lib/stores/decomposition-store-v3";
import type {
  ApprovalGate,
  DecompAuditEntry,
  EscalationRecord,
  GateId,
  PlanHold,
  PlanMetadata,
  PlanState,
} from "@/types/decomposition";

const STALE_DAYS = 5;
const STALE_WORKFLOW_DAYS = 14;

const GATE_LABELS: Record<GateId, string> = {
  architecture: "Architecture",
  workforce: "Workforce",
  governance: "Governance",
};

const DEFAULT_APPROVERS: Record<GateId, { name: string; initials: string }> = {
  architecture: { name: "", initials: "" },
  workforce: { name: "", initials: "" },
  governance: { name: "", initials: "" },
};

function legacyToV3(plan: DecompositionPlan): PlanState {
  switch (plan.state) {
    case "not_started":
      return "drafting";
    case "drafting":
      return plan.readinessScore >= 1 ? "scoped" : "drafting";
    case "ready_for_commit":
      return "pending_approval";
    case "committed":
      return plan.totalCommittedTasks > 0 ? "decomposed" : "approved";
    case "in_delivery":
      return "in_delivery";
  }
}

function daysSince(raw?: string): number {
  if (!raw) return 0;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000));
}

function defaultGates(): ApprovalGate[] {
  return (["architecture", "workforce", "governance"] as GateId[]).map((id) => {
    const approver = DEFAULT_APPROVERS[id];
    return {
      id,
      label: GATE_LABELS[id],
      approverName: approver.name,
      approverInitials: approver.initials,
      state: "pending",
      daysInState: 0,
      approverActiveCount: 0,
    };
  });
}

/** Synthesize gate states from legacy plan when no store override exists. */
function deriveGatesFromLegacy(plan: DecompositionPlan): ApprovalGate[] {
  return defaultGates().map((g) => {
    if (
      plan.state === "in_delivery" ||
      plan.state === "committed" ||
      plan.state === "ready_for_commit"
    ) {
      // Pre-existing approved plans: architecture + workforce auto-approved when readiness ≥ 90.
      if (plan.readinessScore >= 90 && (g.id === "architecture" || g.id === "workforce")) {
        return {
          ...g,
          state: "approved",
          decidedAt: new Date(Date.now() - 86_400_000 * 3).toISOString(),
          daysInState: 3,
        };
      }
      // Governance still pending if any governance checkpoint is not ready.
      if (g.id === "governance") {
        const allGov = plan.governanceCheckpoints?.length ?? 0;
        const ready =
          plan.governanceCheckpoints?.filter((c) => c.status === "ready").length ?? 0;
        return {
          ...g,
          state: allGov > 0 && ready === allGov ? "approved" : "pending",
          decidedAt:
            allGov > 0 && ready === allGov
              ? new Date(Date.now() - 86_400_000).toISOString()
              : undefined,
          daysInState: 2,
        };
      }
    }
    return g;
  });
}

export interface PlanV3 {
  raw: DecompositionPlan;
  sow?: EnterpriseSow;
  state: PlanState;
  gates: ApprovalGate[];
  escalations: EscalationRecord[];
  hold?: PlanHold;
  audit: DecompAuditEntry[];
  appliedHintIds: string[];
  dismissedHintIds: string[];

  /** Derived id (we don't have a plan id on the mock — use sowId as a stable id). */
  planId: string;
  /** Days since the most recent lifecycle transition. */
  daysInState: number;
  stale: boolean;
  deadlock: boolean;

  /** Convenience metrics. */
  totalTasks: number;
  blockedDependencies: number;
  understaffedSkills: number;
  governanceBlocked: number;
}

export interface DecompositionOverview {
  plans: PlanV3[];
  counts: Record<PlanState, number>;
  pendingApprovalCount: number;
  staleApprovalCount: number;
  staleWorkflowCount: number;
  escalationCount: number;
  deadlockCount: number;
  holdCount: number;
  blockedDependencyCount: number;
  understaffedCount: number;
  totalTasks: number;
}

function derivePlan(
  raw: DecompositionPlan,
  sow: EnterpriseSow | undefined,
  meta: PlanMetadata | undefined,
): PlanV3 {
  const planId = raw.sowId;
  const v3State: PlanState = meta?.state ?? legacyToV3(raw);
  const gates: ApprovalGate[] = meta?.gates?.length
    ? meta.gates
    : deriveGatesFromLegacy(raw);

  const anchor =
    v3State === "in_delivery"
      ? meta?.deliveryStartedAt
      : v3State === "decomposed"
        ? meta?.decomposedAt
        : v3State === "approved"
          ? meta?.approvedAt
          : v3State === "pending_approval"
            ? meta?.submittedAt
            : v3State === "ai_reviewed"
              ? meta?.aiReviewedAt
              : v3State === "scoped"
                ? meta?.scopedAt
                : meta?.draftedAt;
  const daysInState = daysSince(anchor);

  const totalTasks = raw.totalCommittedTasks + raw.totalProposedTasks;

  const blockedDependencies = raw.workstreams.reduce((acc, ws) => {
    // A dependency is "blocked" if the upstream workstream's id is in dependsOn
    // and that upstream is not yet completed.
    if (!ws.dependsOn?.length) return acc;
    return (
      acc +
      ws.dependsOn.filter((dep) => {
        const up = raw.workstreams.find((w) => w.id === dep);
        return up && up.status !== "completed";
      }).length
    );
  }, 0);

  const understaffedSkills = (raw.skillRequirements ?? []).filter(
    (s) => s.matchPct < 70,
  ).length;

  const governanceBlocked = (raw.governanceCheckpoints ?? []).filter(
    (c) => c.status === "blocked",
  ).length;

  const rejectedGates = gates.filter((g) => g.state === "rejected").length;
  const stalePending = gates.some(
    (g) =>
      (g.state === "pending" || g.state === "in_review") &&
      g.daysInState >= STALE_DAYS,
  );
  const deadlock = rejectedGates >= 2;
  const stale =
    daysInState >= STALE_WORKFLOW_DAYS ||
    (v3State === "pending_approval" && stalePending);

  return {
    raw,
    sow,
    state: v3State,
    gates,
    escalations: meta?.escalations ?? [],
    hold: meta?.hold,
    audit: meta?.audit ?? [],
    appliedHintIds: meta?.appliedHintIds ?? [],
    dismissedHintIds: meta?.dismissedHintIds ?? [],
    planId,
    daysInState,
    stale,
    deadlock,
    totalTasks,
    blockedDependencies,
    understaffedSkills,
    governanceBlocked,
  };
}

export function useDecompositionOverviewV3(): DecompositionOverview {
  const metaById = useDecompStoreV3((s) => s.metaById);
  const sowById = React.useMemo(() => {
    const out = new Map<string, EnterpriseSow>();
    enterpriseSows.forEach((s) => out.set(s.id, s));
    return out;
  }, []);

  return React.useMemo(() => {
    const plans = decompositionPlans.map((raw) =>
      derivePlan(raw, sowById.get(raw.sowId), metaById[raw.sowId]),
    );

    const counts: Record<PlanState, number> = {
      drafting: 0,
      scoped: 0,
      ai_reviewed: 0,
      pending_approval: 0,
      approved: 0,
      decomposed: 0,
      in_delivery: 0,
    };
    plans.forEach((p) => {
      counts[p.state] += 1;
    });

    const pendingApprovalCount = counts.pending_approval;
    const staleApprovalCount = plans.filter(
      (p) => p.state === "pending_approval" && p.stale,
    ).length;
    const staleWorkflowCount = plans.filter(
      (p) => p.daysInState >= STALE_WORKFLOW_DAYS,
    ).length;
    const escalationCount = plans.filter((p) =>
      p.escalations.some((e) => !e.resolvedAt),
    ).length;
    const deadlockCount = plans.filter((p) => p.deadlock).length;
    const holdCount = plans.filter((p) => !!p.hold && !p.hold.releasedAt).length;
    const blockedDependencyCount = plans.reduce(
      (a, p) => a + p.blockedDependencies,
      0,
    );
    const understaffedCount = plans.reduce(
      (a, p) => a + p.understaffedSkills,
      0,
    );
    const totalTasks = plans.reduce((a, p) => a + p.totalTasks, 0);

    return {
      plans,
      counts,
      pendingApprovalCount,
      staleApprovalCount,
      staleWorkflowCount,
      escalationCount,
      deadlockCount,
      holdCount,
      blockedDependencyCount,
      understaffedCount,
      totalTasks,
    };
  }, [metaById, sowById]);
}
