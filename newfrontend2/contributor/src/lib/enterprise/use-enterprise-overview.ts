/**
 * Enterprise V2 — operational overview hook.
 *
 * Derives strategic KPIs from the unified contributor task store +
 * lightweight enterprise mocks (SOWs · projects · alerts · billing).
 * No separate Enterprise data ecosystem.
 *
 * Used by the Enterprise Dashboard to drive header tiles, alerts,
 * pending acceptance counts, workforce activity, and billing snapshot.
 */

"use client";

import * as React from "react";
import {
  useContributorTasksStore,
  type Task,
} from "@/lib/stores/contributor-tasks-store";
import {
  enterpriseSows,
  enterpriseProjects,
  enterpriseAlerts,
  billingSnapshot,
  type EnterpriseProject,
  type EnterpriseSow,
  type OperationalAlert,
} from "@/mocks/data/enterprise-v2-orchestration";

export interface EnterpriseOverview {
  // SOW counts
  activeSows: EnterpriseSow[];
  sowsAwaitingApproval: EnterpriseSow[];
  sowsApprovedThisQuarter: number;

  // Project counts
  projectsInFlight: EnterpriseProject[];
  projectsAtRisk: number;
  projectsCompleted: number;

  // Acceptance queue — tasks mentor-approved but not yet enterprise-accepted
  pendingAcceptances: Task[];

  // Workforce activity — contributors with at least one active task
  activeContributorTaskCount: number;
  contributorsActive: number;

  // Review bottleneck — tasks in mentor's queue
  underMentorReview: number;
  inRevision: number;

  // Risk snapshot
  criticalAlertCount: number;
  warningAlertCount: number;
  watchAlertCount: number;

  // Billing
  quarterToDate: number;
  quarterBudget: number;
  quarterUtilization: number; // 0–100
  outstandingInvoiceCount: number;
  outstandingInvoiceTotal: number;
  pendingPayoutCount: number;
  pendingPayoutTotal: number;

  // Raw collections
  alerts: OperationalAlert[];
  projects: EnterpriseProject[];
  sows: EnterpriseSow[];
}

export function useEnterpriseOverview(): EnterpriseOverview {
  const tasksById = useContributorTasksStore((s) => s.tasksById);

  return React.useMemo(() => {
    const tasks = Object.values(tasksById);

    // Active SOWs = approved + decomposing + in_delivery
    const activeSows = enterpriseSows.filter((s) =>
      ["approved", "decomposing", "in_delivery"].includes(s.state),
    );
    const sowsAwaitingApproval = enterpriseSows.filter((s) =>
      ["draft", "in_review", "approval"].includes(s.state),
    );
    const sowsApprovedThisQuarter = enterpriseSows.filter((s) => s.state !== "draft" && s.state !== "in_review").length;

    const projectsInFlight = enterpriseProjects.filter((p) => p.health !== "completed");
    const projectsAtRisk = enterpriseProjects.filter((p) => p.health === "at_risk" || p.health === "watch").length;
    const projectsCompleted = enterpriseProjects.filter((p) => p.health === "completed").length;

    // Pending enterprise acceptance — mentor-approved tasks (state: completed)
    // In Phase 1B this maps 1:1 with completed tasks; future state machine
    // adds an explicit `pending_enterprise_acceptance` between mentor-approval
    // and enterprise sign-off.
    const pendingAcceptances = tasks
      .filter((t) => t.state === "completed" || t.state === "approved")
      .sort((a, b) => {
        const da = new Date(a.acceptedAt ?? a.lastActivityAt).getTime();
        const db = new Date(b.acceptedAt ?? b.lastActivityAt).getTime();
        return db - da;
      })
      .slice(0, 8);

    const activeContributorTaskCount = tasks.filter((t) =>
      ["accepted", "in_progress", "blocked", "awaiting_clarification", "ready_for_submission"].includes(t.state),
    ).length;

    // Approximate workforce headcount from mentor diversity in the seed
    const contributorsActive = new Set(
      tasks
        .filter((t) =>
          ["accepted", "in_progress", "ready_for_submission", "revision_requested", "under_review"].includes(t.state),
        )
        .map((t) => t.mentor.name),
    ).size;

    const underMentorReview = tasks.filter((t) => t.state === "under_review").length;
    const inRevision = tasks.filter((t) => t.state === "revision_requested").length;

    const criticalAlertCount = enterpriseAlerts.filter((a) => a.severity === "critical").length;
    const warningAlertCount = enterpriseAlerts.filter((a) => a.severity === "warning").length;
    const watchAlertCount = enterpriseAlerts.filter((a) => a.severity === "watch").length;

    const quarterUtilization = Math.round((billingSnapshot.quarterToDate / billingSnapshot.quarterBudget) * 100);

    return {
      activeSows,
      sowsAwaitingApproval,
      sowsApprovedThisQuarter,
      projectsInFlight,
      projectsAtRisk,
      projectsCompleted,
      pendingAcceptances,
      activeContributorTaskCount,
      contributorsActive,
      underMentorReview,
      inRevision,
      criticalAlertCount,
      warningAlertCount,
      watchAlertCount,
      quarterToDate: billingSnapshot.quarterToDate,
      quarterBudget: billingSnapshot.quarterBudget,
      quarterUtilization,
      outstandingInvoiceCount: billingSnapshot.outstandingInvoices.count,
      outstandingInvoiceTotal: billingSnapshot.outstandingInvoices.total,
      pendingPayoutCount: billingSnapshot.pendingPayouts.count,
      pendingPayoutTotal: billingSnapshot.pendingPayouts.total,
      alerts: enterpriseAlerts,
      projects: enterpriseProjects,
      sows: enterpriseSows,
    };
  }, [tasksById]);
}
