/**
 * Enterprise V2 — Projects (delivery oversight) hook.
 *
 * Derives per-program operational state from the unified contributor task
 * store. Each program rolls up its task IDs into:
 *   - workforce activity (in_progress / under_review / revision_requested)
 *   - acceptance readiness (completed + pending sign-off)
 *   - blockers (blocked / awaiting_clarification / escalated)
 *   - completion percentage
 *   - days to target
 *   - last activity timestamp
 *
 * Plus portfolio aggregates used by header KPIs and AI risk insights.
 */

"use client";

import * as React from "react";
import {
  useContributorTasksStore,
  type Task,
} from "@/lib/stores/contributor-tasks-store";
import {
  enterpriseProjects,
  type EnterpriseProject,
  type ProjectHealth,
} from "@/mocks/data/enterprise-v2-orchestration";

export interface ProgramMetrics {
  totalTasks: number;
  completed: number;
  inFlight: number;
  underReview: number;
  inRevision: number;
  blocked: number;
  awaitingMentor: number;
  awaitingAcceptance: number;
  completionPct: number;
  daysToTarget: number; // negative if past
  riskLevel: "ok" | "watch" | "at_risk";
  hasGovernanceHold: boolean;
  workforceCount: number; // unique mentors active on this program's tasks
  lastActivityAt?: string;
}

export interface ProgramView {
  program: EnterpriseProject;
  tasks: Task[];
  metrics: ProgramMetrics;
}

export interface ProjectsOverview {
  programs: ProgramView[];
  byHealth: Record<ProjectHealth, ProgramView[]>;
  totalsActive: number;
  totalsCompleted: number;
  workforceActive: number;
  awaitingAcceptance: number;
  totalBlockers: number;
  totalEscalations: number;
  programsAtRisk: number;
  milestonesInFlight: number;
}

function parseTarget(raw: string): number {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return 30;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function computeProgramMetrics(program: EnterpriseProject, tasks: Task[]): ProgramMetrics {
  const completed = tasks.filter((t) => t.state === "completed" || t.state === "approved").length;
  const inFlight = tasks.filter((t) =>
    ["accepted", "in_progress", "ready_for_submission"].includes(t.state),
  ).length;
  const underReview = tasks.filter((t) => t.state === "under_review").length;
  const inRevision = tasks.filter((t) => t.state === "revision_requested").length;
  const blocked = tasks.filter((t) => t.state === "blocked").length;
  const awaitingMentor = tasks.filter(
    (t) => t.state === "awaiting_clarification",
  ).length;
  const awaitingAcceptance = tasks.filter(
    (t) =>
      (t.state === "completed" || t.state === "approved") && !program.id.includes("completed"),
  ).length;
  const totalTasks = tasks.length;
  const completionPct = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
  const daysToTarget = parseTarget(program.targetDate);

  // Risk derivation: at_risk if many blockers OR past target without completion
  let riskLevel: "ok" | "watch" | "at_risk" = "ok";
  if (program.health === "at_risk") riskLevel = "at_risk";
  else if (blocked > 0 || (daysToTarget < 7 && completionPct < 70)) riskLevel = "at_risk";
  else if (inRevision > 0 || daysToTarget < 14) riskLevel = "watch";

  const hasGovernanceHold = tasks.some((t) =>
    (t.mentorFeedback?.requiredCorrections ?? []).some((c) => c.severity === "blocker"),
  );

  const workforceCount = new Set(tasks.map((t) => t.mentor.name)).size;

  const lastActivityAt = tasks
    .map((t) => t.lastActivityAt)
    .filter(Boolean)
    .sort()
    .pop();

  return {
    totalTasks,
    completed,
    inFlight,
    underReview,
    inRevision,
    blocked,
    awaitingMentor,
    awaitingAcceptance,
    completionPct,
    daysToTarget,
    riskLevel,
    hasGovernanceHold,
    workforceCount,
    lastActivityAt,
  };
}

export function useProjectsOverview(): ProjectsOverview {
  const tasksById = useContributorTasksStore((s) => s.tasksById);

  return React.useMemo(() => {
    const programs: ProgramView[] = enterpriseProjects.map((p) => {
      const tasks = p.taskIds.map((id) => tasksById[id]).filter(Boolean);
      const metrics = computeProgramMetrics(p, tasks);
      return { program: p, tasks, metrics };
    });

    const byHealth: Record<ProjectHealth, ProgramView[]> = {
      on_track: programs.filter((v) => v.program.health === "on_track"),
      watch: programs.filter((v) => v.program.health === "watch"),
      at_risk: programs.filter((v) => v.program.health === "at_risk"),
      completed: programs.filter((v) => v.program.health === "completed"),
    };

    const totalsActive = programs.filter((v) => v.program.health !== "completed").length;
    const totalsCompleted = programs.filter((v) => v.program.health === "completed").length;
    const workforceActive = programs.reduce(
      (acc, v) => acc + v.metrics.inFlight + v.metrics.inRevision,
      0,
    );
    const awaitingAcceptance = programs.reduce(
      (acc, v) =>
        acc +
        (v.program.health !== "completed"
          ? v.metrics.completed
          : 0),
      0,
    );
    const totalBlockers = programs.reduce(
      (acc, v) => acc + v.metrics.blocked + v.metrics.awaitingMentor,
      0,
    );
    const totalEscalations = programs.reduce(
      (acc, v) => acc + (v.metrics.hasGovernanceHold ? 1 : 0),
      0,
    );
    const programsAtRisk = byHealth.at_risk.length + byHealth.watch.length;
    const milestonesInFlight = programs.reduce(
      (acc, v) => acc + v.program.milestones.filter((m) => m.status === "active").length,
      0,
    );

    return {
      programs,
      byHealth,
      totalsActive,
      totalsCompleted,
      workforceActive,
      awaitingAcceptance,
      totalBlockers,
      totalEscalations,
      programsAtRisk,
      milestonesInFlight,
    };
  }, [tasksById]);
}
