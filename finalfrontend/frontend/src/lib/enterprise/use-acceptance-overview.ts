/**
 * Enterprise V2 — Review Workspace overview hook.
 *
 * Derives the acceptance queue + KPIs from the unified contributor task
 * store. Pending acceptance = mentor-approved (`state === "completed"`)
 * tasks where `enterpriseAccepted` is not yet true. Accepted = same store
 * tasks with `state === "approved"`. Rework requested = tasks where the
 * enterprise sent the work back.
 */

"use client";

import * as React from "react";
import {
  useContributorTasksStore,
  type Task,
} from "@/lib/stores/contributor-tasks-store";

export interface AcceptanceRow {
  task: Task;
  /** Hours since the task became eligible for enterprise acceptance. */
  hoursInQueue: number;
  /** Number of submission rounds the contributor went through. */
  rounds: number;
  /** Number of evidence artifacts attached to the delivery. */
  evidenceCount: number;
  /** Number of mentor governance markers across the lifecycle. */
  governanceMarkers: number;
  /** Whether this delivery is approaching or breached SLA. */
  slaStatus: "ok" | "watch" | "breach";
  /** Decomposition project this delivery belongs to (if discoverable). */
  programTitle?: string;
}

export interface AcceptanceOverview {
  pending: AcceptanceRow[];
  accepted: AcceptanceRow[];
  reworkRequested: AcceptanceRow[];
  pendingCount: number;
  acceptedThisQuarter: number;
  reworkCount: number;
  avgHoursToAccept: number;
  slaBreaches: number;
  slaWatch: number;
}

const SLA_HOURS_BREACH = 48;
const SLA_HOURS_WATCH = 24;

function hoursSince(raw: string | undefined): number {
  if (!raw) return 0;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return 0;
  const diffMs = Date.now() - d.getTime();
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));
}

function toAcceptanceRow(t: Task): AcceptanceRow {
  const arrived = t.acceptanceArrivedAt ?? t.acceptedAt ?? t.lastActivityAt;
  const hoursInQueue = hoursSince(arrived);
  const slaStatus: AcceptanceRow["slaStatus"] =
    hoursInQueue >= SLA_HOURS_BREACH
      ? "breach"
      : hoursInQueue >= SLA_HOURS_WATCH
      ? "watch"
      : "ok";

  const governanceMarkers =
    (t.mentorFeedback?.requiredCorrections ?? []).filter((c) => c.severity === "blocker").length;

  return {
    task: t,
    hoursInQueue,
    rounds: t.reworkRound,
    evidenceCount: t.evidence.length,
    governanceMarkers,
    slaStatus,
  };
}

export function useAcceptanceOverview(): AcceptanceOverview {
  const tasksById = useContributorTasksStore((s) => s.tasksById);

  return React.useMemo(() => {
    const tasks = Object.values(tasksById);

    const pending = tasks
      .filter((t) => t.state === "completed" && !t.enterpriseAccepted)
      .map(toAcceptanceRow)
      .sort((a, b) => b.hoursInQueue - a.hoursInQueue);

    const accepted = tasks
      .filter((t) => t.state === "approved" || (t.state === "completed" && t.enterpriseAccepted))
      .map(toAcceptanceRow)
      .sort((a, b) => {
        const da = new Date(a.task.enterpriseDecisionAt ?? a.task.acceptedAt ?? a.task.lastActivityAt).getTime();
        const db = new Date(b.task.enterpriseDecisionAt ?? b.task.acceptedAt ?? b.task.lastActivityAt).getTime();
        return db - da;
      });

    const reworkRequested = tasks
      .filter(
        (t) =>
          t.enterpriseDecisionAt &&
          !t.enterpriseAccepted &&
          t.state === "revision_requested",
      )
      .map(toAcceptanceRow);

    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const quarterStart = new Date(now.getFullYear(), currentQuarter * 3, 1);

    const acceptedThisQuarter = accepted.filter((r) => {
      const decided = r.task.enterpriseDecisionAt ?? r.task.acceptedAt;
      if (!decided) return false;
      const d = new Date(decided);
      return !isNaN(d.getTime()) && d >= quarterStart;
    }).length;

    const avgHoursToAccept =
      accepted.length > 0
        ? Math.round(accepted.reduce((acc, r) => acc + r.hoursInQueue, 0) / accepted.length)
        : 0;

    const slaBreaches = pending.filter((r) => r.slaStatus === "breach").length;
    const slaWatch = pending.filter((r) => r.slaStatus === "watch").length;

    return {
      pending,
      accepted,
      reworkRequested,
      pendingCount: pending.length,
      acceptedThisQuarter,
      reworkCount: reworkRequested.length,
      avgHoursToAccept,
      slaBreaches,
      slaWatch,
    };
  }, [tasksById]);
}
