/**
 * Delivery Tracking v3 overview — emits the 5-role propagation lifecycle.
 *
 * A "delivery" is a Task from the unified contributor task store. Each
 * task is mapped to a single `DeliveryStage` based on its lifecycle
 * state. SLA breaches are computed against the stage's default SLA
 * window with per-delivery override support.
 */

"use client";

import * as React from "react";
import {
  useContributorTasksStore,
  type Task,
} from "@/lib/stores/contributor-tasks-store";
import { useDeliveryStoreV3 } from "@/lib/stores/delivery-store-v3";
import {
  DEFAULT_SLA_HOURS,
  DELIVERY_STAGES,
  type ActivityEvent,
  type DeliveryAuditEntry,
  type DeliveryStage,
  type InterventionRecord,
  type SeverityState,
} from "@/types/delivery";

export interface DeliveryV3 {
  task: Task;
  stage: DeliveryStage;
  severity: SeverityState;
  /** Hours elapsed in the current stage (capped at SLA window for display use). */
  hoursInStage: number;
  /** Hours past the SLA target (0 if inside window). */
  hoursOverSla: number;
  /** SLA window for this delivery (override-aware). */
  slaHours: number;
  /** Owner name + initials displayed on the delivery card. */
  ownerName: string;
  ownerInitials: string;
  /** Whether the delivery has an active hold. */
  onHold: boolean;
  interventions: InterventionRecord[];
  audit: DeliveryAuditEntry[];
}

export interface BottleneckRow {
  id: string;
  stage: DeliveryStage;
  kind:
    | "sla_breach"
    | "reviewer_overload"
    | "mentor_backlog"
    | "governance_hold"
    | "acceptance_backlog";
  severity: "critical" | "high" | "watch";
  title: string;
  detail: string;
  /** Deliveries implicated in this bottleneck. */
  deliveries: DeliveryV3[];
}

export interface DeliveryOverviewV3 {
  deliveries: DeliveryV3[];
  byStage: Record<DeliveryStage, DeliveryV3[]>;
  /** Active count per stage. */
  stageCounts: Record<DeliveryStage, number>;
  /** Deliveries that entered the stage in the last 24h. */
  stageDeltas: Record<DeliveryStage, number>;
  /** Deliveries that left the stage (moved on) in the last 24h. */
  stageOutflow: Record<DeliveryStage, number>;
  totalActive: number;
  slaBreachCount: number;
  blockedCount: number;
  escalatedCount: number;
  holdCount: number;
  acceptanceReadyCount: number;
  billingReadyCount: number;
  /** Movement: total deliveries that advanced ≥1 stage in last 24h. */
  movementLast24h: number;
  bottlenecks: BottleneckRow[];
  activity: ActivityEvent[];
}

const REVIEWER_OVERLOAD = 8;
const MENTOR_BACKLOG = 12;

function hoursSince(raw?: string): number {
  if (!raw) return 0;
  const d = new Date(raw).getTime();
  if (isNaN(d)) return 0;
  return Math.max(0, (Date.now() - d) / 36e5);
}

function stageForTask(t: Task): DeliveryStage {
  // Map contributor task states to a single propagation role.
  switch (t.state) {
    case "approved":
      // Approved by mentor; awaiting enterprise.
      // If enterprise has already accepted → billing.
      return t.enterpriseAccepted ? "billing" : "enterprise";
    case "completed":
      return t.enterpriseAccepted ? "billing" : "enterprise";
    case "under_review":
      // Mentor is reviewing.
      return "mentor";
    case "revision_requested":
    case "awaiting_clarification":
      // Returned to contributor.
      return "contributor";
    case "ready_for_submission":
      // Contributor finished; waiting to submit.
      return "contributor";
    case "escalated":
      return "reviewer";
    case "blocked":
      return "contributor";
    case "assigned":
    case "accepted":
    case "in_progress":
    default:
      return "contributor";
  }
}

function severityFor(
  stage: DeliveryStage,
  hoursInStage: number,
  slaHours: number,
  onHold: boolean,
  taskState: Task["state"],
): { severity: SeverityState; hoursOverSla: number } {
  if (onHold) return { severity: "blocked", hoursOverSla: 0 };
  if (taskState === "escalated") return { severity: "escalated", hoursOverSla: 0 };
  if (taskState === "blocked") return { severity: "blocked", hoursOverSla: 0 };
  const overSla = Math.max(0, hoursInStage - slaHours);
  if (overSla > 0) return { severity: "breach", hoursOverSla: overSla };
  if (hoursInStage >= slaHours * 0.75) return { severity: "slow", hoursOverSla: 0 };
  return { severity: "flowing", hoursOverSla: 0 };
}

function ownerNameFor(t: Task, stage: DeliveryStage): string {
  if (stage === "contributor") {
    // Contributors aren't named on the task — fall back to mentor's pair.
    return t.mentor?.name ?? "Contributor";
  }
  if (stage === "mentor") return t.mentor?.name ?? "Mentor";
  if (stage === "reviewer") return "Reviewer";
  if (stage === "enterprise") return t.enterpriseDecisionBy ?? "Enterprise";
  return "Billing";
}

function ownerInitialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function buildActivity(deliveries: DeliveryV3[]): ActivityEvent[] {
  const out: ActivityEvent[] = [];

  deliveries.forEach((d) => {
    // Recent submissions → mentor review
    const lastSubmission = (d.task.submissions ?? []).slice(-1)[0];
    if (lastSubmission && hoursSince(lastSubmission.submittedAt) < 72) {
      out.push({
        id: `sub-${d.task.id}-${lastSubmission.round}`,
        at: lastSubmission.submittedAt,
        kind: "submission",
        title: `Round ${lastSubmission.round} submitted to mentor review`,
        detail: `${d.task.title} · ${d.task.skill} · ${d.task.skillLevel}`,
        stages: ["contributor", "mentor"],
        taskId: d.task.id,
        tone: "flowing",
      });
    }

    // Enterprise decision events
    if (d.task.enterpriseDecisionAt && hoursSince(d.task.enterpriseDecisionAt) < 72) {
      if (d.task.enterpriseAccepted) {
        out.push({
          id: `acc-${d.task.id}`,
          at: d.task.enterpriseDecisionAt,
          kind: "enterprise_decision",
          title: "Enterprise acceptance unlocked billing",
          detail: `${d.task.title} · ${d.task.payoutAmount} · ${d.task.enterpriseDecisionBy ?? "operator"}`,
          stages: ["enterprise", "billing"],
          taskId: d.task.id,
          tone: "flowing",
        });
      } else {
        out.push({
          id: `rew-${d.task.id}`,
          at: d.task.enterpriseDecisionAt,
          kind: "enterprise_decision",
          title: "Enterprise sent delivery back for rework",
          detail: `${d.task.title} · returned to mentor`,
          stages: ["enterprise", "mentor"],
          taskId: d.task.id,
          tone: "slow",
        });
      }
    }

    // Holds raised in the last week
    if (d.onHold) {
      out.push({
        id: `hld-${d.task.id}`,
        at: new Date().toISOString(),
        kind: "hold",
        title: "Delivery placed on hold",
        detail: `${d.task.title} · review paused`,
        stages: [d.stage],
        taskId: d.task.id,
        tone: "blocked",
      });
    }

    // SLA breaches
    if (d.severity === "breach") {
      out.push({
        id: `sla-${d.task.id}`,
        at: new Date(Date.now() - d.hoursOverSla * 36e5).toISOString(),
        kind: "sla_breach",
        title: `${stageLabel(d.stage)} SLA breach`,
        detail: `${d.task.title} · ${Math.round(d.hoursOverSla)}h past SLA`,
        stages: [d.stage],
        taskId: d.task.id,
        tone: "breach",
      });
    }

    // Interventions
    d.interventions.slice(-2).forEach((iv) => {
      if (hoursSince(iv.at) > 72) return;
      out.push({
        id: iv.id,
        at: iv.at,
        kind: iv.kind === "reassigned" ? "reassignment" : iv.kind === "held" ? "hold" : iv.kind === "released" ? "release" : "escalation",
        title:
          iv.kind === "reassigned"
            ? "Reviewer reassigned"
            : iv.kind === "sla_overridden"
              ? "SLA overridden"
              : iv.kind === "convened"
                ? "Async review convened"
                : iv.kind === "held"
                  ? "Delivery placed on hold"
                  : iv.kind === "released"
                    ? "Hold released"
                    : iv.kind === "escalated"
                      ? "Escalated"
                      : "Escalation withdrawn",
        detail: `${d.task.title}${iv.note ? ` · ${iv.note}` : ""}`,
        stages: [iv.stage],
        taskId: d.task.id,
        tone:
          iv.kind === "held"
            ? "blocked"
            : iv.kind === "escalated"
              ? "breach"
              : iv.kind === "released"
                ? "flowing"
                : "neutral",
      });
    });
  });

  return out
    .filter(
      (e, i, arr) => arr.findIndex((other) => other.id === e.id) === i,
    )
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 60);
}

function stageLabel(stage: DeliveryStage): string {
  return DELIVERY_STAGES.find((s) => s.id === stage)?.label ?? stage;
}

function buildBottlenecks(byStage: Record<DeliveryStage, DeliveryV3[]>): BottleneckRow[] {
  const out: BottleneckRow[] = [];

  // SLA breach buckets per stage
  (["mentor", "reviewer", "enterprise"] as DeliveryStage[]).forEach((stage) => {
    const breached = byStage[stage].filter((d) => d.severity === "breach");
    if (breached.length === 0) return;
    out.push({
      id: `slab-${stage}`,
      stage,
      kind: "sla_breach",
      severity: breached.length >= 4 ? "critical" : breached.length >= 2 ? "high" : "watch",
      title: `${breached.length} SLA breach${breached.length === 1 ? "" : "es"} in ${stageLabel(stage).toLowerCase()} queue`,
      detail: `Oldest ${Math.round(Math.max(...breached.map((d) => d.hoursOverSla)))}h past SLA`,
      deliveries: breached,
    });
  });

  // Reviewer overload
  if (byStage.reviewer.length >= REVIEWER_OVERLOAD) {
    out.push({
      id: "rev-overload",
      stage: "reviewer",
      kind: "reviewer_overload",
      severity: byStage.reviewer.length >= REVIEWER_OVERLOAD * 1.5 ? "critical" : "high",
      title: `Reviewer queue saturation · ${byStage.reviewer.length} active`,
      detail: "Velocity below intake; reassigning peers typically restores flow.",
      deliveries: byStage.reviewer,
    });
  }

  // Mentor backlog
  if (byStage.mentor.length >= MENTOR_BACKLOG) {
    out.push({
      id: "mentor-backlog",
      stage: "mentor",
      kind: "mentor_backlog",
      severity: byStage.mentor.length >= MENTOR_BACKLOG * 1.5 ? "critical" : "high",
      title: `Mentor backlog · ${byStage.mentor.length} awaiting review`,
      detail: "Throughput below 7-day average. Consider adding mentor capacity.",
      deliveries: byStage.mentor,
    });
  }

  // Governance holds
  const holds = Object.values(byStage)
    .flat()
    .filter((d) => d.onHold);
  if (holds.length > 0) {
    out.push({
      id: "holds",
      stage: holds[0].stage,
      kind: "governance_hold",
      severity: holds.length >= 3 ? "high" : "watch",
      title: `${holds.length} governance hold${holds.length === 1 ? "" : "s"} active`,
      detail: "Lifecycle frozen on these deliveries until manually released.",
      deliveries: holds,
    });
  }

  // Acceptance backlog
  const enterpriseLong = byStage.enterprise.filter((d) => d.hoursInStage >= 24);
  if (enterpriseLong.length >= 5) {
    out.push({
      id: "acc-backlog",
      stage: "enterprise",
      kind: "acceptance_backlog",
      severity: enterpriseLong.length >= 10 ? "critical" : "high",
      title: `${enterpriseLong.length} deliveries awaiting acceptance > 24h`,
      detail: "Billing throughput will lag without action on this queue.",
      deliveries: enterpriseLong,
    });
  }

  // Order by severity
  const rank = { critical: 0, high: 1, watch: 2 } as const;
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

export function useDeliveryOverviewV3(): DeliveryOverviewV3 {
  const tasksById = useContributorTasksStore((s) => s.tasksById);
  const metaById = useDeliveryStoreV3((s) => s.metaById);

  return React.useMemo(() => {
    const tasks = Object.values(tasksById);

    const deliveries: DeliveryV3[] = tasks.map((task) => {
      const meta = metaById[task.id];
      const stage = stageForTask(task);
      // Pick the anchor for "hours in stage" — last activity is the best proxy
      // we have on the mock task shape.
      const anchor = task.enterpriseDecisionAt ?? task.acceptedAt ?? task.lastActivityAt;
      const hoursInStage = hoursSince(anchor);
      const slaHours = meta?.slaOverrideHours ?? DEFAULT_SLA_HOURS[stage];
      const onHold = !!meta?.hold && !meta.hold.releasedAt;
      const { severity, hoursOverSla } = severityFor(
        stage,
        hoursInStage,
        slaHours,
        onHold,
        task.state,
      );
      const ownerName = ownerNameFor(task, stage);
      const ownerInitials = task.mentor?.initials ?? ownerInitialsFor(ownerName);
      return {
        task,
        stage,
        severity,
        hoursInStage,
        hoursOverSla,
        slaHours,
        ownerName,
        ownerInitials,
        onHold,
        interventions: meta?.interventions ?? [],
        audit: meta?.audit ?? [],
      };
    });

    const byStage: Record<DeliveryStage, DeliveryV3[]> = {
      contributor: [],
      mentor: [],
      reviewer: [],
      enterprise: [],
      billing: [],
    };
    deliveries.forEach((d) => byStage[d.stage].push(d));

    const stageCounts: Record<DeliveryStage, number> = {
      contributor: byStage.contributor.length,
      mentor: byStage.mentor.length,
      reviewer: byStage.reviewer.length,
      enterprise: byStage.enterprise.length,
      billing: byStage.billing.length,
    };

    // Inflow per stage in last 24h — proxy via lastActivityAt
    const stageDeltas: Record<DeliveryStage, number> = {
      contributor: 0,
      mentor: 0,
      reviewer: 0,
      enterprise: 0,
      billing: 0,
    };
    deliveries.forEach((d) => {
      if (hoursSince(d.task.lastActivityAt) < 24) stageDeltas[d.stage] += 1;
    });

    // Outflow per stage in last 24h — proxy via decision events
    const stageOutflow: Record<DeliveryStage, number> = {
      contributor: 0,
      mentor: 0,
      reviewer: 0,
      enterprise: 0,
      billing: 0,
    };
    deliveries.forEach((d) => {
      if (d.task.enterpriseDecisionAt && hoursSince(d.task.enterpriseDecisionAt) < 24) {
        stageOutflow.enterprise += 1;
        if (d.task.enterpriseAccepted) stageOutflow.billing -= 0; // inflow tracked above
      }
    });

    const slaBreachCount = deliveries.filter((d) => d.severity === "breach").length;
    const blockedCount = deliveries.filter((d) => d.severity === "blocked").length;
    const escalatedCount = deliveries.filter(
      (d) => d.severity === "escalated",
    ).length;
    const holdCount = deliveries.filter((d) => d.onHold).length;
    const acceptanceReadyCount = byStage.enterprise.length;
    const billingReadyCount = byStage.billing.length;

    const movementLast24h = deliveries.filter(
      (d) => hoursSince(d.task.lastActivityAt) < 24,
    ).length;

    const bottlenecks = buildBottlenecks(byStage);
    const activity = buildActivity(deliveries);

    return {
      deliveries,
      byStage,
      stageCounts,
      stageDeltas,
      stageOutflow,
      totalActive:
        deliveries.length - byStage.billing.length, // billing already cleared
      slaBreachCount,
      blockedCount,
      escalatedCount,
      holdCount,
      acceptanceReadyCount,
      billingReadyCount,
      movementLast24h,
      bottlenecks,
      activity,
    };
  }, [tasksById, metaById]);
}
