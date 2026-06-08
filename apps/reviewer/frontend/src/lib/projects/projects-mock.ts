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
import { quote as priceQuote } from "@/lib/pricing/pricing-engine";

const RATE_PER_HOUR = 1200; // ₹/h — matches payouts.ts + pricing-engine
const MINOR = 100;

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

/** One contributor's billable line under a milestone (carried from the plan task).
 *  assignee is "Unassigned" / assigneeId "" until the enterprise selects an
 *  interested contributor (locked flow — no auto-assignment). */
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
    | "published" //   open to the contributor pool — collecting interest
    | "assigned" //    enterprise selected one interested contributor
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
  /** Published-task details shown to contributors (price visible first). */
  description?: string;
  technologies?: string[];
  priceMinor?: number; //          enterprise-facing price (deal/AI price, pre-GST)
  deadline?: string; // ISO
  /** Pricing model — "ai" (default, actual×factor) or "manual" (enterprise-typed base). */
  priceMode?: "manual" | "ai";
  /** Manual base price the enterprise typed (manual mode only), minor units. */
  manualBaseMinor?: number;
  /** Glimmora-assigned mentor + Enterprise-assigned reviewer (after assignment). */
  reviewerId?: string;
  reviewerName?: string;
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

// Seed projects removed — only real, chain-provisioned projects (via overlay) appear.
const PROJECTS: ProjectDetail[] = [];

const COMPLETED_PROJECTS: ProjectSummary[] = [];

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

  // Per the locked flow, tasks are PUBLISHED to the contributor pool (price +
  // details visible) and stay Unassigned until the enterprise selects an
  // interested contributor. No round-robin auto-assignment.
  const milestones: ProjectMilestone[] = plan.milestones
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((m) => {
      const msTasks = plan.tasks.filter((t) => t.milestoneId === m.id);
      const lineItems: ProjectMilestoneLineItem[] = msTasks.map((t) => {
        const hours = t.estimatedHours ?? 8;
        return {
          taskId: t.id,
          title: t.title,
          assignee: "Unassigned",
          assigneeId: "",
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
  const taskDeadline = due; // project due date as the default task deadline
  const tasks: ProjectTaskRow[] = plan.tasks.map((t) => {
    const ms = plan.milestones.find((m) => m.id === t.milestoneId);
    const hours = t.estimatedHours ?? 0;
    return {
      id: t.id,
      title: t.title,
      milestone: ms?.name ?? "—",
      assignee: "Unassigned",
      // Tasks open for contributor interest. (Honor pre-set states if a plan
      // task already carried one.)
      state:
        t.status === "accepted"
          ? "accepted"
          : t.status === "in_progress"
            ? "in_progress"
            : "published",
      effortHours: hours,
      requiredSkills: t.requiredSkills,
      workforceSourcing: t.workforceSourcing ?? null,
      reviewPath: t.reviewPath ?? null,
      // Published-task detail shown to contributors (price first).
      description: t.description ?? undefined,
      technologies: t.requiredSkills,
      // Default to AI pricing (no real AI yet → actualCost × factor). Enterprise
      // can switch a task to manual pricing in the project view.
      priceMode: "ai" as const,
      priceMinor: priceQuote({ mode: "ai", hours }).enterprisePriceMinor,
      deadline: taskDeadline,
    };
  });

  const project: ProjectDetail = {
    id,
    name: opts.sowTitle ?? `Project — ${plan.sowId}`,
    sponsor: opts.sponsor ?? "",
    pmo: opts.pmo ?? "",
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
      audit: [{ id: `aud-${projectId}-${Date.now()}`, ts: now, actor: "", action: "milestone.accepted", resource: milestoneId }, ...p.audit],
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
      tenantId: "",
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
      audit: [{ id: `aud-${projectId}-${Date.now()}`, ts: now, actor: "", action: "milestone.paid", resource: milestoneId }, ...p.audit],
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
            state: "assigned" as const,
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
          actor: "",
          action: "task.assign",
          resource: taskId,
        },
        ...p.audit,
      ],
    };
  });
}

/* ──────────────── delivery: published-task opportunity board ──────────────── */

/** A published task surfaced to the contributor pool (price visible first). */
export interface PublishedTask {
  projectId: string;
  projectName: string;
  taskId: string;
  title: string;
  milestone: string;
  description?: string;
  technologies: string[];
  priceMinor: number;
  effortHours: number;
  deadline?: string;
}

/** All tasks across projects that are open for contributor interest. */
export function listPublishedTasksMock(): PublishedTask[] {
  const out: PublishedTask[] = [];
  for (const p of allDetail()) {
    for (const t of p.tasks) {
      if (t.state !== "published") continue;
      out.push({
        projectId: p.id,
        projectName: p.name,
        taskId: t.id,
        title: t.title,
        milestone: t.milestone,
        description: t.description,
        technologies: t.technologies ?? t.requiredSkills ?? [],
        priceMinor: t.priceMinor ?? t.effortHours * RATE_PER_HOUR * MINOR,
        effortHours: t.effortHours,
        deadline: t.deadline,
      });
    }
  }
  return out;
}

/** Enterprise sets a task's price mode. Manual → recompute deal price from the
 *  typed base (+markup+flat); AI → recompute from actualCost × factor. */
export function setTaskPriceMock(
  projectId: string,
  taskId: string,
  input: { mode: "manual" | "ai"; manualBaseMinor?: number },
): ProjectDetail {
  const now = new Date().toISOString();
  return patchProject(projectId, (p) => {
    const tasks = p.tasks.map((t) => {
      if (t.id !== taskId) return t;
      const q = priceQuote({
        mode: input.mode,
        hours: t.effortHours,
        manualPriceMinor: input.manualBaseMinor,
      });
      return {
        ...t,
        priceMode: input.mode,
        manualBaseMinor: input.mode === "manual" ? input.manualBaseMinor : undefined,
        priceMinor: q.enterprisePriceMinor,
      };
    });
    return {
      ...p,
      tasks,
      audit: [
        { id: `aud-${projectId}-${Date.now()}`, ts: now, actor: "", action: "task.price", resource: taskId },
        ...p.audit,
      ],
    };
  });
}

/** Enterprise assigns a reviewer AFTER the task is given to the contributor. */
export function assignReviewerMock(
  projectId: string,
  taskId: string,
  reviewer: { id: string; name: string },
): ProjectDetail {
  const now = new Date().toISOString();
  return patchProject(projectId, (p) => ({
    ...p,
    tasks: p.tasks.map((t) =>
      t.id === taskId ? { ...t, reviewerId: reviewer.id, reviewerName: reviewer.name } : t,
    ),
    recentActivity: [
      { id: `a-${Date.now()}`, ts: now, text: `Reviewer ${reviewer.name} assigned to ${taskId}` },
      ...p.recentActivity,
    ],
    audit: [
      {
        id: `aud-${projectId}-${Date.now()}`,
        ts: now,
        actor: "",
        action: "reviewer.assign",
        resource: taskId,
      },
      ...p.audit,
    ],
  }));
}
