/**
 * Enterprise V2 — Delivery Tracking hook.
 *
 * Distinct from Projects (which is portfolio-tile oversight). Delivery
 * Tracking is the **temporal/flow** view — it shows the operational
 * progression of work through the lifecycle in real time:
 *
 *   Assigned → In Progress → Under Review → Revision → Accepted
 *
 * Derives from the unified contributor task store + decomposition mock.
 * Surfaces lifecycle-stage counts, per-program velocity, bottlenecks,
 * dependency chains, and acceptance progression.
 */

"use client";

import * as React from "react";
import {
  useContributorTasksStore,
  type Task,
} from "@/lib/stores/contributor-tasks-store";
import { decompositionPlans } from "@/mocks/data/enterprise-decomposition";
import {
  enterpriseProjects,
  type EnterpriseProject,
} from "@/mocks/data/enterprise-v2-orchestration";

/* ─────────────────────── Lifecycle stage taxonomy ─────────────────────── */

export type LifecycleStage =
  | "assigned"
  | "in_progress"
  | "under_review"
  | "revision"
  | "ready_for_acceptance"
  | "accepted";

export interface StageBucket {
  stage: LifecycleStage;
  label: string;
  description: string;
  tasks: Task[];
}

export interface ProgressionStream {
  program: EnterpriseProject;
  tasks: Task[];
  // Per-stage counts for this program's tasks
  byStage: Record<LifecycleStage, number>;
  // Synthetic "weekly velocity" — tasks that moved a stage forward in the last week
  // For mock realism: approximated from completed+approved counts
  velocityPerWeek: number;
  // Whether work is moving (any in-flight or review activity)
  hasActiveMovement: boolean;
  // Bottleneck flag — stuck in revision / blocked / awaiting clarification
  bottleneckCount: number;
}

export interface BottleneckRow {
  task: Task;
  programTitle: string;
  reason: "stuck_in_revision" | "blocked" | "awaiting_clarification" | "sla_breach";
  detail: string;
  hoursStuck: number;
}

export interface DependencyChain {
  upstreamTaskId: string;
  upstreamTitle: string;
  downstreamWorkstreamLabel: string;
  programTitle: string;
  status: "ready" | "waiting";
}

export interface DeliveryTrackingOverview {
  stages: StageBucket[];
  streams: ProgressionStream[];
  bottlenecks: BottleneckRow[];
  dependencies: DependencyChain[];
  // Header KPIs
  totalActive: number;
  movementThisWeek: number;
  bottleneckCount: number;
  slaBreaches: number;
  acceptanceReady: number;
  escalationsOpen: number;
  averageCycleHours: number;
}

/* ─────────────────────── Helpers ─────────────────────── */

function classifyStage(t: Task): LifecycleStage {
  if (t.state === "completed" && !t.enterpriseAccepted) return "ready_for_acceptance";
  if (t.state === "approved" || (t.state === "completed" && t.enterpriseAccepted)) return "accepted";
  if (t.state === "under_review") return "under_review";
  if (t.state === "revision_requested") return "revision";
  if (
    t.state === "accepted" ||
    t.state === "in_progress" ||
    t.state === "ready_for_submission" ||
    t.state === "awaiting_clarification" ||
    t.state === "blocked"
  )
    return "in_progress";
  return "assigned";
}

function hoursSince(raw: string | undefined): number {
  if (!raw) return 0;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return 0;
  return Math.max(0, Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60)));
}

const SLA_BREACH_HOURS = 48;

export function useDeliveryTracking(): DeliveryTrackingOverview {
  const tasksById = useContributorTasksStore((s) => s.tasksById);

  return React.useMemo(() => {
    const allTasks = Object.values(tasksById);

    /* ── Stage buckets ── */
    const stageOrder: LifecycleStage[] = [
      "assigned",
      "in_progress",
      "under_review",
      "revision",
      "ready_for_acceptance",
      "accepted",
    ];
    const stageLabels: Record<LifecycleStage, { label: string; description: string }> = {
      assigned: { label: "Assigned", description: "Awaiting contributor accept" },
      in_progress: { label: "In Progress", description: "Workforce execution" },
      under_review: { label: "With Mentor", description: "Mentor governance" },
      revision: { label: "Revision", description: "Contributor refining" },
      ready_for_acceptance: { label: "Acceptance Gate", description: "Enterprise sign-off pending" },
      accepted: { label: "Accepted", description: "Lifecycle closed" },
    };

    const stages: StageBucket[] = stageOrder.map((s) => ({
      stage: s,
      label: stageLabels[s].label,
      description: stageLabels[s].description,
      tasks: allTasks.filter((t) => classifyStage(t) === s),
    }));

    /* ── Progression streams (per program) ── */
    const streams: ProgressionStream[] = enterpriseProjects.map((p) => {
      const tasks = p.taskIds.map((id) => tasksById[id]).filter(Boolean);
      const byStage = stageOrder.reduce(
        (acc, s) => {
          acc[s] = tasks.filter((t) => classifyStage(t) === s).length;
          return acc;
        },
        {} as Record<LifecycleStage, number>,
      );
      // Velocity: synthesize from completion + acceptance — proxy for "movement"
      const completedOrAccepted = byStage.accepted + byStage.ready_for_acceptance;
      const velocityPerWeek = Math.max(
        0,
        Math.round((completedOrAccepted / Math.max(1, tasks.length)) * 5),
      );
      const hasActiveMovement =
        byStage.in_progress + byStage.under_review + byStage.revision > 0;
      const bottleneckCount = tasks.filter(
        (t) =>
          t.state === "blocked" ||
          t.state === "awaiting_clarification" ||
          (t.state === "revision_requested" && t.reworkRound >= 2),
      ).length;

      return {
        program: p,
        tasks,
        byStage,
        velocityPerWeek,
        hasActiveMovement,
        bottleneckCount,
      };
    });

    /* ── Bottlenecks ── */
    const bottlenecks: BottleneckRow[] = [];
    for (const stream of streams) {
      for (const t of stream.tasks) {
        const hoursStuck = hoursSince(t.lastActivityAt);
        if (t.state === "blocked") {
          bottlenecks.push({
            task: t,
            programTitle: stream.program.title,
            reason: "blocked",
            detail: "Dependency or external input missing",
            hoursStuck,
          });
        } else if (t.state === "awaiting_clarification") {
          bottlenecks.push({
            task: t,
            programTitle: stream.program.title,
            reason: "awaiting_clarification",
            detail: "Awaiting mentor reply · SLA paused",
            hoursStuck,
          });
        } else if (t.state === "revision_requested" && t.reworkRound >= 2) {
          bottlenecks.push({
            task: t,
            programTitle: stream.program.title,
            reason: "stuck_in_revision",
            detail: `Round ${t.reworkRound} · multiple revision cycles`,
            hoursStuck,
          });
        } else if (
          t.state === "completed" &&
          !t.enterpriseAccepted &&
          hoursStuck >= SLA_BREACH_HOURS
        ) {
          bottlenecks.push({
            task: t,
            programTitle: stream.program.title,
            reason: "sla_breach",
            detail: `${hoursStuck}h awaiting enterprise acceptance · past SLA`,
            hoursStuck,
          });
        }
      }
    }

    /* ── Dependency chains (from decomposition mock) ── */
    const dependencies: DependencyChain[] = [];
    for (const plan of decompositionPlans) {
      const program = enterpriseProjects.find(
        (p) => p.sowId === plan.sowId,
      );
      if (!program) continue;
      for (const ws of plan.workstreams) {
        if (ws.status !== "proposed" || !ws.dependsOn || ws.dependsOn.length === 0) continue;
        for (const depWsId of ws.dependsOn) {
          const depWs = plan.workstreams.find((w) => w.id === depWsId);
          if (!depWs) continue;
          // Find an upstream task representing the dependency
          const upstreamUnit = depWs.taskUnits.find((u) => u.taskIdInStore);
          if (!upstreamUnit) continue;
          const upstreamTask = tasksById[upstreamUnit.taskIdInStore!];
          if (!upstreamTask) continue;
          const upstreamReady =
            upstreamTask.state === "completed" || upstreamTask.state === "approved";
          dependencies.push({
            upstreamTaskId: upstreamTask.id,
            upstreamTitle: upstreamTask.title,
            downstreamWorkstreamLabel: ws.label,
            programTitle: program.title,
            status: upstreamReady ? "ready" : "waiting",
          });
        }
      }
    }

    /* ── Header KPIs ── */
    const totalActive = allTasks.filter(
      (t) =>
        t.state !== "completed" &&
        t.state !== "approved" &&
        t.state !== "escalated",
    ).length;
    // movementThisWeek: synthesize from accepted + completed counts (proxy for "moved this week")
    const movementThisWeek =
      stages.find((s) => s.stage === "accepted")?.tasks.length ?? 0;
    const slaBreaches = bottlenecks.filter((b) => b.reason === "sla_breach").length;
    const acceptanceReady =
      stages.find((s) => s.stage === "ready_for_acceptance")?.tasks.length ?? 0;
    const escalationsOpen = bottlenecks.filter(
      (b) => b.reason === "stuck_in_revision" || b.reason === "blocked",
    ).length;
    const averageCycleHours =
      streams.length > 0
        ? Math.round(
            streams.reduce((acc, s) => acc + 48 + s.bottleneckCount * 12, 0) / streams.length,
          )
        : 0;

    return {
      stages,
      streams,
      bottlenecks,
      dependencies,
      totalActive,
      movementThisWeek,
      bottleneckCount: bottlenecks.length,
      slaBreaches,
      acceptanceReady,
      escalationsOpen,
      averageCycleHours,
    };
  }, [tasksById]);
}

/* ─────────────────────── Stage tone helper ─────────────────────── */

export function stageTone(s: LifecycleStage): {
  ring: string;
  tint: string;
  bg: string;
  border: string;
} {
  switch (s) {
    case "assigned":
      return {
        ring: "ring-beige-200 bg-beige-50",
        tint: "text-beige-700",
        bg: "bg-beige-50/40",
        border: "border-beige-200",
      };
    case "in_progress":
      return {
        ring: "ring-teal-200 bg-teal-50",
        tint: "text-teal-700",
        bg: "bg-teal-50/40",
        border: "border-teal-200",
      };
    case "under_review":
      return {
        ring: "ring-beige-200 bg-beige-50",
        tint: "text-beige-700",
        bg: "bg-beige-50/60",
        border: "border-beige-300",
      };
    case "revision":
      return {
        ring: "ring-gold-200 bg-gold-50",
        tint: "text-gold-800",
        bg: "bg-gold-50/40",
        border: "border-gold-200",
      };
    case "ready_for_acceptance":
      return {
        ring: "ring-brown-200 bg-brown-50",
        tint: "text-brown-800",
        bg: "bg-brown-50/40",
        border: "border-brown-200",
      };
    case "accepted":
      return {
        ring: "ring-forest-200 bg-forest-50",
        tint: "text-forest-700",
        bg: "bg-forest-50/40",
        border: "border-forest-200",
      };
  }
}

export function bottleneckTone(r: BottleneckRow["reason"]): {
  chip: string;
  ring: string;
  tint: string;
  label: string;
} {
  switch (r) {
    case "blocked":
      return {
        chip: "border-brown-300 bg-brown-50 text-brown-800",
        ring: "ring-brown-200 bg-brown-50",
        tint: "text-brown-700",
        label: "Blocked",
      };
    case "awaiting_clarification":
      return {
        chip: "border-gold-200 bg-gold-50 text-gold-800",
        ring: "ring-gold-200 bg-gold-50",
        tint: "text-gold-800",
        label: "Awaiting reply",
      };
    case "stuck_in_revision":
      return {
        chip: "border-gold-200 bg-gold-50 text-gold-800",
        ring: "ring-gold-200 bg-gold-50",
        tint: "text-gold-800",
        label: "Stuck in revision",
      };
    case "sla_breach":
      return {
        chip: "border-brown-300 bg-brown-50 text-brown-800",
        ring: "ring-brown-200 bg-brown-50",
        tint: "text-brown-800",
        label: "SLA breach",
      };
  }
}
