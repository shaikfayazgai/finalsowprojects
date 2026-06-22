/**
 * Projects v3 overview — explicit lifecycle + health + flags + milestone
 * state per program. Derives from `enterpriseProjects` mock + unified
 * contributor task store, then merges persisted overrides from
 * `useProjectsStoreV3`.
 */

"use client";

import * as React from "react";
import {
  enterpriseProjects,
  type EnterpriseProject,
  type ProjectHealth as LegacyProjectHealth,
} from "@/mocks/data/enterprise-v2-orchestration";
import {
  useContributorTasksStore,
  type Task,
} from "@/lib/stores/contributor-tasks-store";
import { useProjectsStoreV3 } from "@/lib/stores/projects-store-v3";
import type {
  ExceptionRecord,
  MilestoneRecord,
  MilestoneState,
  ProjectAuditEntry,
  ProjectFlag,
  ProjectHold,
  ProjectHealth,
  ProjectLifecycleState,
} from "@/types/projects";

const STALE_DAYS = 14;
const SLA_DAYS_PAST_TARGET = 5;

/**
 * Maps a legacy `ProjectHealth` literal directly through (they share the
 * same value space). Kept as a function so future remapping is one place.
 */
function mapHealth(h: LegacyProjectHealth): ProjectHealth {
  return h;
}

function daysSince(raw?: string): number {
  if (!raw) return 0;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000));
}

function daysUntil(raw?: string): number {
  if (!raw) return 0;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return 0;
  return Math.floor((d.getTime() - Date.now()) / 86_400_000);
}

/**
 * Derives the current lifecycle state from project + task signals.
 * Operator-recorded `lifecycleOverride` wins when present.
 */
function deriveLifecycle(
  project: EnterpriseProject,
  tasks: Task[],
  override?: ProjectLifecycleState,
): ProjectLifecycleState {
  if (override) return override;
  if (project.health === "completed") return "billing";

  const states = tasks.map((t) => t.state);
  const hasApproved = states.includes("approved");
  const hasAccepted = tasks.some((t) => t.enterpriseAccepted);
  const hasUnderReview = states.includes("under_review");
  const hasInProgress = states.includes("in_progress") || states.includes("ready_for_submission");

  if (hasAccepted && hasApproved) return "billing";
  if (hasApproved) return "enterprise_acceptance";
  if (hasUnderReview) return "mentor_review";
  if (hasInProgress) return "execution";
  if (tasks.length > 0) return "staffing";
  return "decomposition";
}

function deriveMilestones(
  project: EnterpriseProject,
  overrides: Record<string, MilestoneState> | undefined,
): MilestoneRecord[] {
  return project.milestones.map((m, idx) => {
    const override = overrides?.[m.id];
    const baseState: MilestoneState =
      override ??
      (m.status === "done"
        ? "done"
        : m.status === "active"
          ? "active"
          : "upcoming");
    // Last milestone unlocks billing in our model.
    const isBillingTrigger = idx === project.milestones.length - 1;
    return {
      id: m.id,
      label: m.label,
      state: baseState,
      billingTrigger: isBillingTrigger,
      reviewGate: idx > 0 && idx < project.milestones.length - 1 && idx % 2 === 0,
    };
  });
}

export interface ProjectV3 {
  raw: EnterpriseProject;
  /** Tasks bound to this project from the unified task store. */
  tasks: Task[];
  state: ProjectLifecycleState;
  health: ProjectHealth;
  milestones: MilestoneRecord[];
  flags: ProjectFlag[];
  exceptions: ExceptionRecord[];
  hold?: ProjectHold;
  audit: ProjectAuditEntry[];
  ownerInitials: string;
  /** Numeric progress (0–100) — % milestones done. */
  progressPct: number;
  /** Budget utilization (0–N, can exceed 100). */
  utilizationPct: number;
  /** Days remaining until target (negative if past). */
  daysToTarget: number;
  daysSinceLastMovement: number;
  /** Convenience flags. */
  stale: boolean;
  blocked: boolean;
  overrun: boolean;
  slaBreach: boolean;
}

export interface ProjectsOverviewV3 {
  projects: ProjectV3[];
  /** Counts per health tier. */
  health: Record<ProjectHealth, number>;
  /** Counts per lifecycle stage. */
  lifecycle: Record<ProjectLifecycleState, number>;
  activeCount: number;
  blockedCount: number;
  staleCount: number;
  slaBreachCount: number;
  holdCount: number;
  overrunCount: number;
  exceptionCount: number;
  totalBudgetCents: number;
  totalSpentCents: number;
  /** Average utilization across active programs. */
  avgUtilizationPct: number;
  /** Average days-to-target across active programs. */
  avgDaysToTarget: number;
}

function deriveProject(
  raw: EnterpriseProject,
  tasksById: Record<string, Task>,
  metaById: ReturnType<typeof useProjectsStoreV3.getState>["metaById"],
): ProjectV3 {
  const meta = metaById[raw.id];
  const tasks = raw.taskIds.map((id) => tasksById[id]).filter(Boolean) as Task[];

  const state = deriveLifecycle(raw, tasks, meta?.lifecycleOverride);
  const health = mapHealth(raw.health);
  const milestones = deriveMilestones(raw, meta?.milestoneOverrides);

  const flags: ProjectFlag[] = meta?.flags ? [...meta.flags] : [];
  const utilizationPct = raw.budget > 0 ? (raw.spent / raw.budget) * 100 : 0;
  const overrun = utilizationPct > 100;
  if (overrun && !flags.includes("budget_overrun")) flags.push("budget_overrun");

  const daysToTarget = daysUntil(raw.targetDate);
  const slaBreach = daysToTarget < -SLA_DAYS_PAST_TARGET && health !== "completed";
  if (slaBreach && !flags.includes("sla_breach")) flags.push("sla_breach");

  // Last-movement anchor — newest task lastActivityAt.
  const lastMovement = tasks
    .map((t) => new Date(t.lastActivityAt).getTime())
    .filter((n) => !isNaN(n))
    .sort((a, b) => b - a)[0];
  const daysSinceLastMovement = lastMovement
    ? Math.max(0, Math.floor((Date.now() - lastMovement) / 86_400_000))
    : daysSince(raw.startedAt);
  const stale = daysSinceLastMovement >= STALE_DAYS && health !== "completed";
  if (stale && !flags.includes("stale")) flags.push("stale");

  const blockedTasks = tasks.filter((t) => t.state === "revision_requested").length;
  const blocked = blockedTasks > 0 && health === "at_risk";
  if (blocked && !flags.includes("blocked")) flags.push("blocked");

  const onHold = !!meta?.hold && !meta.hold.releasedAt;
  if (onHold && !flags.includes("on_hold")) flags.push("on_hold");

  const milestoneDone = milestones.filter((m) => m.state === "done").length;
  const progressPct = milestones.length > 0 ? (milestoneDone / milestones.length) * 100 : 0;

  return {
    raw,
    tasks,
    state,
    health,
    milestones,
    flags,
    exceptions: meta?.exceptions ?? [],
    hold: meta?.hold,
    audit: meta?.audit ?? [],
    ownerInitials: meta?.ownerOverride ?? raw.ownerInitials,
    progressPct,
    utilizationPct,
    daysToTarget,
    daysSinceLastMovement,
    stale,
    blocked,
    overrun,
    slaBreach,
  };
}

export function useProjectsOverviewV3(): ProjectsOverviewV3 {
  const tasksById = useContributorTasksStore((s) => s.tasksById);
  const metaById = useProjectsStoreV3((s) => s.metaById);

  return React.useMemo(() => {
    const projects = enterpriseProjects.map((p) => deriveProject(p, tasksById, metaById));

    const health: Record<ProjectHealth, number> = {
      on_track: 0,
      watch: 0,
      at_risk: 0,
      completed: 0,
    };
    const lifecycle: Record<ProjectLifecycleState, number> = {
      intake: 0,
      decomposition: 0,
      staffing: 0,
      execution: 0,
      mentor_review: 0,
      reviewer_validation: 0,
      enterprise_acceptance: 0,
      billing: 0,
      closed: 0,
    };
    projects.forEach((p) => {
      health[p.health] += 1;
      lifecycle[p.state] += 1;
    });

    const active = projects.filter((p) => p.health !== "completed");
    const blockedCount = projects.filter((p) => p.blocked).length;
    const staleCount = projects.filter((p) => p.stale).length;
    const slaBreachCount = projects.filter((p) => p.slaBreach).length;
    const holdCount = projects.filter((p) => p.hold && !p.hold.releasedAt).length;
    const overrunCount = projects.filter((p) => p.overrun).length;
    const exceptionCount = projects.reduce(
      (a, p) => a + p.exceptions.filter((e) => !e.resolvedAt).length,
      0,
    );

    const totalBudgetCents = projects.reduce((a, p) => a + p.raw.budget, 0);
    const totalSpentCents = projects.reduce((a, p) => a + p.raw.spent, 0);
    const avgUtilizationPct = active.length
      ? active.reduce((a, p) => a + p.utilizationPct, 0) / active.length
      : 0;
    const avgDaysToTarget = active.length
      ? Math.round(
          active.reduce((a, p) => a + p.daysToTarget, 0) / active.length,
        )
      : 0;

    return {
      projects,
      health,
      lifecycle,
      activeCount: active.length,
      blockedCount,
      staleCount,
      slaBreachCount,
      holdCount,
      overrunCount,
      exceptionCount,
      totalBudgetCents,
      totalSpentCents,
      avgUtilizationPct,
      avgDaysToTarget,
    };
  }, [tasksById, metaById]);
}
