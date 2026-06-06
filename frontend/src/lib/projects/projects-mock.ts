/**
 * Spec-shaped projects mock — used until a /api/projects endpoint ships.
 *
 * Per user direction: projects rebuilt to spec shape with mock data
 * (no real backend yet). Replace with a TanStack hook once the API
 * lands; consumer surface stays the same.
 *
 * Chain wiring: projects can now be *provisioned* from an approved
 * decomposition plan (provisionProjectFromPlanMock), carrying sowId +
 * planId so the SOW → decomposition → project → payment chain connects.
 * Milestones gate payment behind acceptance; paying a milestone emits
 * eligible contributor payouts for that milestone's line items.
 */

import type { PlanDetail } from "@/lib/decomposition/types";
import type { PayoutDetail } from "@/lib/payouts/types";
import { applyOverlay, createOverlayStore } from "@/lib/enterprise/mocks/overlay";
import { recordDemoTaskAssignment } from "@/lib/enterprise/mocks/demo-task-assignments";
import { payoutOverlay } from "@/lib/enterprise/mocks/payouts";

const RATE_PER_HOUR = 1200; // ₹/h — matches payouts.ts
const MINOR = 100;
const POOL = [
  { id: "u-sneha", name: "Sneha R." },
  { id: "u-yusuf", name: "Yusuf K." },
  { id: "u-priya", name: "Priya N." },
  { id: "u-amit", name: "Amit S." },
  { id: "u-kavya", name: "Kavya P." },
  { id: "u-rohit", name: "Rohit B." },
];

export type ProjectHealth = "on_track" | "at_risk" | "blocked" | "done";
export type ProjectMilestoneStatus =
  | "done"
  | "on_track"
  | "at_risk"
  | "blocked"
  | "pending";

export interface ProjectSummary {
  id: string;
  name: string;
  sponsor: string;
  pmo: string;
  startedAt: string;
  dueAt: string;
  progress: number; // 0..1
  health: ProjectHealth;
  completedAt?: string;
  /** Set when the project was provisioned from an approved decomposition plan. */
  sowId?: string;
  planId?: string;
}

/** Payment state of a project milestone — drives the acceptance→payment gate. */
export type MilestonePaymentStatus = "locked" | "payable" | "paid";

/** One contributor's billable line under a milestone (carried from the plan task). */
export interface ProjectMilestoneLineItem {
  taskId: string;
  title: string;
  assignee: string;
  assigneeId: string;
  assigneeEmail?: string;
  hours: number;
  amountMinor: number;
}

export interface ProjectMilestone {
  id: string;
  name: string;
  progress: number; // 0..1
  status: ProjectMilestoneStatus;
  note?: string;
  blockedTaskCount?: number;
  /** Acceptance + payment gate (present on provisioned projects). */
  accepted?: boolean;
  acceptedAt?: string;
  paymentStatus?: MilestonePaymentStatus;
  paidAt?: string;
  amountMinor?: number;
  lineItems?: ProjectMilestoneLineItem[];
}

export interface ProjectActivity {
  id: string;
  ts: string; // ISO
  text: string;
}

export interface ProjectAiSignal {
  id: string;
  text: string;
  tone: "info" | "warning" | "critical";
}

export interface ProjectContributorRow {
  id: string;
  name: string;
  role: string;
  level: string;
  taskCount: number;
  acceptanceRate: number; // 0..1
}

export interface ProjectReviewerRow {
  id: string;
  name: string;
  kind: "mentor" | "internal_reviewer";
  reviewedCount: number;
}

export interface ProjectException {
  id: string;
  kind: "sla_at_risk" | "blocked" | "revision_overdue" | "resolved";
  task: string;
  taskId: string;
  detail: string;
  resolvedAt?: string;
}

export interface ProjectBudgetByMilestone {
  milestone: string;
  committedMinor: number;
  paidMinor: number;
  closedPct: number; // 0..1
}

export interface ProjectBudgetByRole {
  role: string;
  amountMinor: number;
  sharePct: number; // 0..1
}

export interface ProjectBudget {
  budgetMinor: number;
  committedMinor: number;
  paidMinor: number;
  pendingMinor: number;
  forecastMinor: number;
  forecastDeltaPct: number; // > 0 → over budget
  byMilestone: ProjectBudgetByMilestone[];
  byRole: ProjectBudgetByRole[];
}

export interface ProjectTaskRow {
  id: string;
  title: string;
  milestone: string;
  assignee: string;
  assigneeId?: string;
  assigneeEmail?: string;
  requiredSkills?: string[];
  state:
    | "ready"
    | "matched"
    | "in_progress"
    | "submitted"
    | "reviewed"
    | "accepted"
    | "blocked";
  effortHours: number;
  workforceSourcing?: string | null;
  reviewPath?: string | null;
}

export interface ProjectAuditEvent {
  id: string;
  ts: string;
  actor: string;
  action: string;
  resource: string;
}

export interface ProjectDetail extends ProjectSummary {
  // Health summary KPIs
  slaAtRiskCount: number;
  qualityAcceptanceRate: number; // 0..1
  budgetBurnMinor: number;
  budgetTotalMinor: number;

  milestones: ProjectMilestone[];
  recentActivity: ProjectActivity[];
  aiSignals: ProjectAiSignal[];

  contributors: ProjectContributorRow[];
  reviewers: ProjectReviewerRow[];

  openExceptions: ProjectException[];
  resolvedExceptions: ProjectException[];

  budget: ProjectBudget;

  tasks: ProjectTaskRow[];
  audit: ProjectAuditEvent[];
}

/* ───────────────────────────── data ───────────────────────────── */

const PROJECTS: ProjectDetail[] = [
  {
    id: "prj-helios-q3",
    name: "Helios Q3",
    sponsor: "Sandeep Kumar",
    pmo: "Anjali Rao",
    startedAt: "2026-04-01T00:00:00Z",
    dueAt: "2026-09-30T00:00:00Z",
    progress: 0.62,
    health: "on_track",
    slaAtRiskCount: 1,
    qualityAcceptanceRate: 0.94,
    budgetBurnMinor: 4_200_000_00,
    budgetTotalMinor: 6_000_000_00,
    milestones: [
      {
        id: "m1",
        name: "Foundation & infra",
        progress: 1,
        status: "done",
      },
      {
        id: "m2",
        name: "Auth + tenanting",
        progress: 0.84,
        status: "on_track",
      },
      {
        id: "m3",
        name: "Reporting surfaces",
        progress: 0.35,
        status: "at_risk",
        note: "Two tasks blocked on data warehouse access",
        blockedTaskCount: 2,
      },
    ],
    recentActivity: [
      { id: "a1", ts: "2026-05-27T01:30:00Z", text: "Task t-4821 reassigned to Kavi" },
      { id: "a2", ts: "2026-05-26T23:00:00Z", text: "Task t-4811 submitted by Sneha" },
      { id: "a3", ts: "2026-05-26T08:00:00Z", text: "Milestone M1 closed" },
    ],
    aiSignals: [
      {
        id: "s1",
        tone: "warning",
        text: "Forecast slip: M3 likely 3 days late at current pace",
      },
      {
        id: "s2",
        tone: "info",
        text: "2 tasks blocked on external dependency (Snowflake schema)",
      },
    ],
    contributors: [
      { id: "c1", name: "Sneha M.", role: "Designer", level: "L3", taskCount: 4, acceptanceRate: 1 },
      { id: "c2", name: "Kavi S.", role: "Designer", level: "L2", taskCount: 3, acceptanceRate: 0.85 },
      { id: "c3", name: "Yusuf O.", role: "Backend", level: "L3", taskCount: 5, acceptanceRate: 0.95 },
      { id: "c4", name: "Priya N.", role: "Backend", level: "L2", taskCount: 4, acceptanceRate: 0.92 },
    ],
    reviewers: [
      { id: "r1", name: "Priya I.", kind: "mentor", reviewedCount: 5 },
      { id: "r2", name: "Karthik I.", kind: "internal_reviewer", reviewedCount: 5 },
    ],
    openExceptions: [
      {
        id: "e1",
        kind: "sla_at_risk",
        task: "Auth modal redesign",
        taskId: "t-4811",
        detail: "Due in 4h · 80% complete",
      },
      {
        id: "e2",
        kind: "blocked",
        task: "Snowflake source connector",
        taskId: "t-4823",
        detail: "2d blocked on Snowflake schema",
      },
      {
        id: "e3",
        kind: "revision_overdue",
        task: "Auth modal copy review",
        taskId: "t-4801",
        detail: "Round 3 · 1d overdue",
      },
    ],
    resolvedExceptions: [
      {
        id: "e4",
        kind: "resolved",
        task: "Helios design review prep",
        taskId: "t-4756",
        detail: "SLA extended by 4h",
        resolvedAt: "2026-05-24T00:00:00Z",
      },
      {
        id: "e5",
        kind: "resolved",
        task: "Tenant settings spec",
        taskId: "t-4740",
        detail: "Reassigned to Yusuf",
        resolvedAt: "2026-05-22T00:00:00Z",
      },
    ],
    budget: {
      budgetMinor: 60_000_000,
      committedMinor: 48_000_000,
      paidMinor: 24_000_000,
      pendingMinor: 24_000_000,
      forecastMinor: 61_200_000,
      forecastDeltaPct: 0.02,
      byMilestone: [
        {
          milestone: "M1 · Foundation & infra",
          committedMinor: 20_000_000,
          paidMinor: 20_000_000,
          closedPct: 1,
        },
        {
          milestone: "M2 · Auth + tenanting",
          committedMinor: 24_000_000,
          paidMinor: 4_000_000,
          closedPct: 0.17,
        },
        {
          milestone: "M3 · Reporting surfaces",
          committedMinor: 4_000_000,
          paidMinor: 0,
          closedPct: 0,
        },
      ],
      byRole: [
        {
          role: "Designer L2–L3",
          amountMinor: 18_000_000,
          sharePct: 0.38,
        },
        { role: "Backend L3", amountMinor: 24_000_000, sharePct: 0.5 },
        { role: "Data L2", amountMinor: 6_000_000, sharePct: 0.12 },
      ],
    },
    tasks: [
      { id: "t-4811", title: "Auth modal redesign", milestone: "M2", assignee: "Sneha M.", state: "in_progress", effortHours: 14 },
      { id: "t-4823", title: "Snowflake source connector", milestone: "M3", assignee: "Yusuf O.", state: "blocked", effortHours: 16 },
      { id: "t-4821", title: "Tenant settings spec", milestone: "M2", assignee: "Kavi S.", state: "submitted", effortHours: 8 },
      { id: "t-4801", title: "Auth modal copy review", milestone: "M2", assignee: "Priya N.", state: "reviewed", effortHours: 4 },
    ],
    audit: [
      {
        id: "au1",
        ts: "2026-05-27T01:30:00Z",
        actor: "Anjali R.",
        action: "task.reassign",
        resource: "task:t-4821",
      },
      {
        id: "au2",
        ts: "2026-05-26T08:00:00Z",
        actor: "Glimmora",
        action: "milestone.close",
        resource: "milestone:m1",
      },
    ],
  },
  {
    id: "prj-reporting-v2",
    name: "Reporting V2",
    sponsor: "Sandeep Kumar",
    pmo: "Anjali Rao",
    startedAt: "2026-06-01T00:00:00Z",
    dueAt: "2026-07-15T00:00:00Z",
    progress: 0.81,
    health: "at_risk",
    slaAtRiskCount: 2,
    qualityAcceptanceRate: 0.92,
    budgetBurnMinor: 4_200_000_00,
    budgetTotalMinor: 6_000_000_00,
    milestones: [
      {
        id: "m1",
        name: "Data plumbing",
        progress: 1,
        status: "done",
        paymentStatus: "paid",
        paidAt: "2026-05-20T00:00:00Z",
        accepted: true,
        acceptedAt: "2026-05-19T00:00:00Z",
        amountMinor: 20_000_000,
      },
      {
        id: "m2",
        name: "Report builder UI",
        progress: 0.72,
        status: "on_track",
        paymentStatus: "paid",
        paidAt: "2026-05-26T00:00:00Z",
        accepted: true,
        acceptedAt: "2026-05-25T00:00:00Z",
        amountMinor: 24_000_000,
      },
      {
        id: "m3",
        name: "Export & schedules",
        progress: 0.3,
        status: "at_risk",
        note: "2 blocked tasks",
        blockedTaskCount: 2,
        paymentStatus: "locked",
        accepted: false,
        amountMinor: 6_480_000,
        lineItems: [
          {
            taskId: "t-demo-assign",
            title: "Dashboard filter API",
            assignee: "Unassigned",
            assigneeId: "",
            assigneeEmail: "",
            hours: 12,
            amountMinor: 12 * RATE_PER_HOUR * MINOR,
          },
          {
            taskId: "t-4720",
            title: "Schedule UI",
            assignee: "Anika S.",
            assigneeId: "c-anika",
            assigneeEmail: "anika@glimmora.dev",
            hours: 18,
            amountMinor: 18 * RATE_PER_HOUR * MINOR,
          },
          {
            taskId: "t-4730",
            title: "CSV export pipeline",
            assignee: "Vikram T.",
            assigneeId: "c-vikram",
            assigneeEmail: "vikram@glimmora.dev",
            hours: 24,
            amountMinor: 24 * RATE_PER_HOUR * MINOR,
          },
        ],
      },
    ],
    recentActivity: [
      { id: "a1", ts: "2026-05-27T00:00:00Z", text: "Task t-4711 accepted by Karthik" },
      { id: "a2", ts: "2026-05-26T16:00:00Z", text: "Forecast revised — burn +2%" },
    ],
    aiSignals: [
      {
        id: "s1",
        tone: "critical",
        text: "M3 at risk: 2 of 4 tasks blocked over 48h",
      },
    ],
    contributors: [
      { id: "c1", name: "Anika S.", role: "Frontend", level: "L3", taskCount: 6, acceptanceRate: 0.93 },
      { id: "c2", name: "Vikram T.", role: "Backend", level: "L3", taskCount: 5, acceptanceRate: 0.95 },
    ],
    reviewers: [
      { id: "r1", name: "Priya I.", kind: "mentor", reviewedCount: 7 },
      { id: "r2", name: "Karthik I.", kind: "internal_reviewer", reviewedCount: 7 },
    ],
    openExceptions: [
      {
        id: "e1",
        kind: "blocked",
        task: "CSV export pipeline",
        taskId: "t-4730",
        detail: "Waiting on infra access",
      },
      {
        id: "e2",
        kind: "sla_at_risk",
        task: "Schedule UI",
        taskId: "t-4720",
        detail: "Due in 6h · 60% complete",
      },
    ],
    resolvedExceptions: [],
    budget: {
      budgetMinor: 60_000_000,
      committedMinor: 48_000_000,
      paidMinor: 24_000_000,
      pendingMinor: 24_000_000,
      forecastMinor: 61_200_000,
      forecastDeltaPct: 0.02,
      byMilestone: [
        { milestone: "M1 · Data plumbing", committedMinor: 20_000_000, paidMinor: 20_000_000, closedPct: 1 },
        { milestone: "M2 · Report builder UI", committedMinor: 24_000_000, paidMinor: 4_000_000, closedPct: 0.17 },
        { milestone: "M3 · Export & schedules", committedMinor: 4_000_000, paidMinor: 0, closedPct: 0 },
      ],
      byRole: [
        { role: "Frontend L3", amountMinor: 24_000_000, sharePct: 0.5 },
        { role: "Backend L3", amountMinor: 18_000_000, sharePct: 0.38 },
        { role: "Data L2", amountMinor: 6_000_000, sharePct: 0.12 },
      ],
    },
    tasks: [
      { id: "t-demo-assign", title: "Dashboard filter API", milestone: "M3", assignee: "Unassigned", state: "ready", effortHours: 12, requiredSkills: ["TypeScript", "React"] },
      { id: "t-4720", title: "Schedule UI", milestone: "M3", assignee: "Anika S.", state: "in_progress", effortHours: 18 },
      { id: "t-4730", title: "CSV export pipeline", milestone: "M3", assignee: "Vikram T.", state: "blocked", effortHours: 24 },
    ],
    audit: [],
  },
  {
    id: "prj-auth-modernize",
    name: "Auth modernize",
    sponsor: "Lakshmi M.",
    pmo: "Anjali Rao",
    startedAt: "2026-05-01T00:00:00Z",
    dueAt: "2026-08-30T00:00:00Z",
    progress: 0.22,
    health: "on_track",
    slaAtRiskCount: 0,
    qualityAcceptanceRate: 1,
    budgetBurnMinor: 1_200_000_00,
    budgetTotalMinor: 8_000_000_00,
    milestones: [
      { id: "m1", name: "SSO integration", progress: 0.45, status: "on_track" },
      { id: "m2", name: "MFA flows", progress: 0.2, status: "pending" },
      { id: "m3", name: "Audit + rotation", progress: 0, status: "pending" },
    ],
    recentActivity: [
      { id: "a1", ts: "2026-05-25T00:00:00Z", text: "Task t-4609 accepted" },
    ],
    aiSignals: [],
    contributors: [
      { id: "c1", name: "Yusuf O.", role: "Backend", level: "L3", taskCount: 3, acceptanceRate: 1 },
    ],
    reviewers: [
      { id: "r1", name: "Priya I.", kind: "mentor", reviewedCount: 2 },
    ],
    openExceptions: [],
    resolvedExceptions: [],
    budget: {
      budgetMinor: 80_000_000,
      committedMinor: 16_000_000,
      paidMinor: 12_000_000,
      pendingMinor: 4_000_000,
      forecastMinor: 80_000_000,
      forecastDeltaPct: 0,
      byMilestone: [],
      byRole: [],
    },
    tasks: [],
    audit: [],
  },
];

const COMPLETED_PROJECTS: ProjectSummary[] = [
  {
    id: "prj-onboarding-revamp",
    name: "Onboarding revamp",
    sponsor: "Lakshmi M.",
    pmo: "Anjali Rao",
    startedAt: "2026-01-10T00:00:00Z",
    dueAt: "2026-03-31T00:00:00Z",
    completedAt: "2026-03-28T00:00:00Z",
    progress: 1,
    health: "done",
  },
  {
    id: "prj-pricing-page",
    name: "Pricing page refresh",
    sponsor: "Sandeep Kumar",
    pmo: "Anjali Rao",
    startedAt: "2026-02-15T00:00:00Z",
    dueAt: "2026-04-30T00:00:00Z",
    completedAt: "2026-04-22T00:00:00Z",
    progress: 1,
    health: "done",
  },
];

/* ───────────────────────────── store ───────────────────────────── */

const overlay = createOverlayStore<ProjectDetail>("glimmora.mock.projects.v1");

function mergeProjectSeed(detail: ProjectDetail): ProjectDetail {
  const seed = PROJECTS.find((p) => p.id === detail.id);
  if (!seed) return detail;
  const milestones = detail.milestones.map((m) => {
    const sm = seed.milestones.find((x) => x.id === m.id);
    if (!sm) return m;
    const lineItems =
      m.lineItems && m.lineItems.length > 0
        ? m.lineItems.map((li) => {
            const sli = sm.lineItems?.find((x) => x.taskId === li.taskId);
            return sli ? { ...sli, ...li } : li;
          })
        : sm.lineItems;
    return {
      ...sm,
      ...m,
      paymentStatus: m.paymentStatus ?? sm.paymentStatus,
      amountMinor: m.amountMinor ?? sm.amountMinor,
      accepted: m.accepted ?? sm.accepted,
      acceptedAt: m.acceptedAt ?? sm.acceptedAt,
      paidAt: m.paidAt ?? sm.paidAt,
      lineItems,
    };
  });
  return { ...seed, ...detail, milestones };
}

function allDetail(): ProjectDetail[] {
  return applyOverlay<ProjectDetail>(PROJECTS, overlay.read()).map(mergeProjectSeed);
}

function toSummary(p: ProjectDetail): ProjectSummary {
  const {
    milestones, recentActivity, aiSignals, contributors, reviewers,
    openExceptions, resolvedExceptions, budget, tasks, audit,
    slaAtRiskCount, qualityAcceptanceRate, budgetBurnMinor, budgetTotalMinor,
    ...summary
  } = p;
  return summary;
}

/* ───────────────────────────── exports ───────────────────────────── */

export function listProjectsMock(): ProjectSummary[] {
  return allDetail().map(toSummary);
}

export function listCompletedProjectsMock(): ProjectSummary[] {
  return COMPLETED_PROJECTS;
}

export function getProjectMock(id: string): ProjectDetail | undefined {
  return allDetail().find((p) => p.id === id);
}

export function getProjectTaskMock(
  projectId: string,
  taskId: string,
): { project: ProjectDetail; task: ProjectTaskRow } | undefined {
  const project = getProjectMock(projectId);
  if (!project) return undefined;
  const task = project.tasks.find((t) => t.id === taskId);
  if (!task) return undefined;
  return { project, task };
}

export { overlay as projectOverlay };

/** Find the project provisioned from a given plan, if any. */
export function getProjectByPlanMock(planId: string): ProjectDetail | undefined {
  return allDetail().find((p) => p.planId === planId);
}

/* ──────────────────── chain: provision from plan ──────────────────── */

const MS_STATUS_BY_PLAN: Record<string, ProjectMilestoneStatus> = {
  completed: "done",
  in_progress: "on_track",
  pending: "pending",
};

/**
 * Provision a delivery project from an approved decomposition plan.
 * Idempotent per planId — returns the existing project if already
 * provisioned. Milestones carry amounts + contributor line items derived
 * from the plan's tasks so the project → payment → payout chain has data.
 */
export function provisionProjectFromPlanMock(
  plan: PlanDetail,
  opts: { sowTitle?: string; sponsor?: string; pmo?: string } = {},
): ProjectDetail {
  // Already provisioned? Return it.
  const existing = allDetail().find((p) => p.planId === plan.id);
  if (existing) return existing;

  const id = `prj-${plan.id.replace(/^plan-/, "")}`;
  const now = new Date().toISOString();
  const due = new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString();

  let poolIdx = 0;
  const milestones: ProjectMilestone[] = plan.milestones
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((m) => {
      const msTasks = plan.tasks.filter((t) => t.milestoneId === m.id);
      const lineItems: ProjectMilestoneLineItem[] = msTasks.map((t) => {
        const who = POOL[poolIdx++ % POOL.length]!;
        const hours = t.estimatedHours ?? 8;
        return {
          taskId: t.id,
          title: t.title,
          assignee: who.name,
          assigneeId: who.id,
          hours,
          amountMinor: hours * RATE_PER_HOUR * MINOR,
        };
      });
      const amountMinor = lineItems.reduce((s, li) => s + li.amountMinor, 0);
      const status = MS_STATUS_BY_PLAN[m.status] ?? "pending";
      return {
        id: m.id,
        name: m.name,
        progress: status === "done" ? 1 : status === "on_track" ? 0.4 : 0,
        status,
        amountMinor,
        accepted: false,
        paymentStatus: "locked" as MilestonePaymentStatus,
        lineItems,
      };
    });

  const budgetTotal = milestones.reduce((s, m) => s + (m.amountMinor ?? 0), 0);
  const tasks: ProjectTaskRow[] = plan.tasks.map((t) => {
    const ms = plan.milestones.find((m) => m.id === t.milestoneId);
    const li = milestones.flatMap((m) => m.lineItems ?? []).find((x) => x.taskId === t.id);
    return {
      id: t.id,
      title: t.title,
      milestone: ms?.name ?? "—",
      assignee: li?.assignee ?? "Unassigned",
      state: t.status === "accepted" ? "accepted" : t.status === "in_progress" ? "in_progress" : "ready",
      effortHours: t.estimatedHours ?? 0,
      requiredSkills: t.requiredSkills,
      workforceSourcing: t.workforceSourcing ?? null,
      reviewPath: t.reviewPath ?? null,
    };
  });

  const project: ProjectDetail = {
    id,
    name: opts.sowTitle ?? `Project — ${plan.sowId}`,
    sponsor: opts.sponsor ?? "Sandeep Kulkarni",
    pmo: opts.pmo ?? "Anjali Rao",
    startedAt: now,
    dueAt: due,
    progress: 0,
    health: "on_track",
    sowId: plan.sowId,
    planId: plan.id,
    slaAtRiskCount: 0,
    qualityAcceptanceRate: 1,
    budgetBurnMinor: 0,
    budgetTotalMinor: budgetTotal,
    milestones,
    recentActivity: [
      { id: `act-${id}-1`, ts: now, text: `Project provisioned from approved plan ${plan.id}.` },
    ],
    aiSignals: [],
    contributors: [],
    reviewers: [],
    openExceptions: [],
    resolvedExceptions: [],
    budget: recomputeBudget(milestones, budgetTotal),
    tasks,
    audit: [
      { id: `aud-${id}-1`, ts: now, actor: "system", action: "project.provisioned", resource: plan.id },
    ],
  };
  overlay.insert(id, project);
  return project;
}

function recomputeBudget(milestones: ProjectMilestone[], budgetTotal: number): ProjectBudget {
  const paidMinor = milestones.filter((m) => m.paymentStatus === "paid").reduce((s, m) => s + (m.amountMinor ?? 0), 0);
  const pendingMinor = milestones.filter((m) => m.paymentStatus !== "paid").reduce((s, m) => s + (m.amountMinor ?? 0), 0);
  return {
    budgetMinor: budgetTotal,
    committedMinor: budgetTotal,
    paidMinor,
    pendingMinor,
    forecastMinor: budgetTotal,
    forecastDeltaPct: 0,
    byMilestone: milestones.map((m) => ({
      milestone: m.name,
      committedMinor: m.amountMinor ?? 0,
      paidMinor: m.paymentStatus === "paid" ? (m.amountMinor ?? 0) : 0,
      closedPct: m.paymentStatus === "paid" ? 1 : 0,
    })),
    byRole: [],
  };
}

function patchProject(id: string, mutate: (p: ProjectDetail) => ProjectDetail): ProjectDetail {
  const current = getProjectMock(id);
  if (!current) throw new Error(`Project ${id} not found`);
  const next = { ...mutate(current) };
  overlay.insert(id, next); // full row so overlay-only provisioned projects stay complete
  return next;
}

/** Accept a milestone — unlocks payment (locked → payable). */
export function acceptProjectMilestoneMock(projectId: string, milestoneId: string): ProjectDetail {
  const now = new Date().toISOString();
  return patchProject(projectId, (p) => {
    const milestones = p.milestones.map((m) =>
      m.id === milestoneId
        ? { ...m, accepted: true, acceptedAt: now, paymentStatus: (m.paymentStatus === "paid" ? "paid" : "payable") as MilestonePaymentStatus }
        : m,
    );
    return {
      ...p,
      milestones,
      audit: [{ id: `aud-${projectId}-${Date.now()}`, ts: now, actor: "Sandeep Kulkarni", action: "milestone.accepted", resource: milestoneId }, ...p.audit],
    };
  });
}

/**
 * Pay an accepted milestone. Gated: throws if not payable. Marks paid,
 * recomputes budget, and emits eligible contributor payouts for the
 * milestone's line items (no enterprise payment ⇒ no payout exists).
 */
export function payProjectMilestoneMock(projectId: string, milestoneId: string): ProjectDetail {
  const now = new Date().toISOString();
  const project = getProjectMock(projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);
  const ms = project.milestones.find((m) => m.id === milestoneId);
  if (!ms) throw new Error(`Milestone ${milestoneId} not found`);
  if (ms.paymentStatus !== "payable") {
    throw new Error("Milestone must be accepted before payment");
  }

  const lineItems = (ms.lineItems ?? []).map((li) => {
    const task = project.tasks.find((t) => t.id === li.taskId);
    if (task?.assigneeId && !li.assigneeId) {
      return {
        ...li,
        assignee: task.assignee,
        assigneeId: task.assigneeId,
        assigneeEmail: task.assigneeEmail,
      };
    }
    return li;
  });

  // Emit eligible payouts for each assigned contributor line item.
  for (const li of lineItems) {
    if (!li.assigneeId) continue;
    const payoutId = `po-${li.taskId}`;
    const payout: PayoutDetail = {
      id: payoutId,
      contributorId: li.assigneeId,
      taskDefinitionId: li.taskId,
      submissionId: `sub-${li.taskId}`,
      tenantId: "tnt-acme-corp",
      amountMinor: li.amountMinor,
      currency: "INR",
      computation: {
        currency: "INR",
        ratePerHour: RATE_PER_HOUR,
        hoursBilled: li.hours,
        amountMinor: li.amountMinor,
        minorMultiplier: MINOR,
        notes: li.assigneeEmail
          ? `Milestone ${milestoneId} payment · ${li.assignee}`
          : undefined,
        contributorEmail: li.assigneeEmail,
      } as PayoutDetail["computation"] & { contributorEmail?: string },
      status: "eligible",
      payoutMethodId: null,
      externalRef: null,
      failureReason: null,
      eligibleAt: now,
      requestedAt: null,
      processingAt: null,
      sentAt: null,
      failedAt: null,
      onHoldAt: null,
      createdAt: now,
      updatedAt: now,
    };
    payoutOverlay.insert(payoutId, payout);
  }

  return patchProject(projectId, (p) => {
    const milestones = p.milestones.map((m) =>
      m.id === milestoneId ? { ...m, paymentStatus: "paid" as MilestonePaymentStatus, paidAt: now } : m,
    );
    return {
      ...p,
      milestones,
      budget: recomputeBudget(milestones, p.budgetTotalMinor),
      budgetBurnMinor: milestones.filter((m) => m.paymentStatus === "paid").reduce((s, m) => s + (m.amountMinor ?? 0), 0),
      audit: [{ id: `aud-${projectId}-${Date.now()}`, ts: now, actor: "Sandeep Kulkarni", action: "milestone.paid", resource: milestoneId }, ...p.audit],
    };
  });
}

/** PMO assigns (or reassigns) a project task to a matched contributor. */
export function assignProjectTaskMock(
  projectId: string,
  taskId: string,
  candidate: {
    id: string;
    name: string;
    email: string;
  },
): ProjectDetail {
  const now = new Date().toISOString();
  return patchProject(projectId, (p) => {
    const tasks = p.tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            assignee: candidate.name,
            assigneeId: candidate.id,
            assigneeEmail: candidate.email,
            state: "matched" as const,
          }
        : t,
    );
    const task = tasks.find((t) => t.id === taskId);
    const milestones = p.milestones.map((m) => {
      if (!m.lineItems?.some((li) => li.taskId === taskId)) return m;
      const lineItems = m.lineItems.map((li) =>
        li.taskId === taskId
          ? {
              ...li,
              assignee: candidate.name,
              assigneeId: candidate.id,
              assigneeEmail: candidate.email,
            }
          : li,
      );
      return { ...m, lineItems };
    });
    if (task) {
      recordDemoTaskAssignment({
        taskId: task.id,
        projectId: p.id,
        projectName: p.name,
        title: task.title,
        contributorId: candidate.id,
        contributorName: candidate.name,
        contributorEmail: candidate.email,
        requiredSkills: task.requiredSkills ?? ["TypeScript"],
        estimatedHours: task.effortHours,
      });
    }
    return {
      ...p,
      tasks,
      milestones,
      recentActivity: [
        { id: `a-${Date.now()}`, ts: now, text: `Task ${taskId} assigned to ${candidate.name}` },
        ...p.recentActivity,
      ],
      audit: [
        {
          id: `aud-${projectId}-${Date.now()}`,
          ts: now,
          actor: "Sandeep Kulkarni",
          action: "task.assign",
          resource: taskId,
        },
        ...p.audit,
      ],
    };
  });
}
