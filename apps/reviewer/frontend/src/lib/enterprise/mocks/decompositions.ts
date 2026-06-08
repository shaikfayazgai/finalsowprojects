/**
 * Decomposition plan mock data + accessors. 6 plans across draft /
 * approved / active / archived. Plan-acme-1 ships with 3 milestones +
 * 6 tasks. The rest carry plausible counts in the summary.
 *
 * Backend handoff: see /api/decomposition/plans contract documented in
 * src/lib/api/decomposition-v2.ts.
 */

import type {
  CreatePlanInput,
  DependencyDetail,
  MilestoneDetail,
  PlanDetail,
  PlanStatus,
  PlanSummary,
  TaskDetail,
  UpdatePlanInput,
} from "@/lib/decomposition/types";
import { applyOverlay, createOverlayStore } from "./overlay";
import { getSowMock } from "./sows";
import { provisionProjectFromPlanMock } from "@/lib/projects/projects-mock";

const OWNER = "";

function iso(daysAgo: number, hours = 9): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hours, 0, 0, 0);
  return d.toISOString();
}

function ms(id: string, order: number, name: string, status: MilestoneDetail["status"], startDays: number, endDays: number, desc?: string): MilestoneDetail {
  return {
    id,
    order,
    name,
    description: desc ?? null,
    startDate: iso(startDays),
    endDate: iso(endDays),
    status,
    createdAt: iso(startDays + 1),
    updatedAt: iso(Math.min(startDays, 1)),
  };
}

function tk(id: string, milestoneId: string | null, order: number, title: string, status: TaskDetail["status"], skills: string[], hours: number, conf: number, externalKey?: string): TaskDetail {
  return {
    id,
    milestoneId,
    externalKey: externalKey ?? null,
    title,
    description: `Demo task: ${title}.`,
    requiredSkills: skills,
    estimatedHours: hours,
    acceptanceCriteria: "Documented in plan.",
    complexity: "medium",
    order,
    status,
    aiConfidence: conf,
    pmoEdited: false,
    workforceSourcing: null,
    reviewPath: null,
    createdAt: iso(7),
    updatedAt: iso(1),
  };
}

const PLAN_DEFAULTS = {
  defaultWorkforceSourcing: "hybrid" as const,
  defaultReviewPath: "internal" as const,
  twoStageReviewEnabled: false,
};

/* ────────────────────────── seed plans ─────────────────────────── */

const PLAN_1: PlanDetail = {
  id: "plan-acme-1",
  sowId: "sow-acme-1",
  version: 1,
  status: "approved",
  summary: "8 milestones · 24 tasks · ~520 hours",
  ...PLAN_DEFAULTS,
  approvedAt: iso(14),
  approvedBy: OWNER,
  activatedAt: iso(12),
  archivedAt: null,
  createdBy: OWNER,
  createdAt: iso(20),
  updatedAt: iso(1),
  milestones: [
    ms("ms-1-m1", 1, "Discovery & inventory", "completed", 14, 5, "Crawl existing endpoints; document v2 contracts."),
    ms("ms-1-m2", 2, "v3 contract design", "in_progress", 5, -10, "Versioned OpenAPI 3.1 + error codes."),
    ms("ms-1-m3", 3, "Deprecation pilot", "pending", -10, -25, "10% traffic shift + monitoring."),
  ],
  tasks: [
    tk("task-acme-1-t1", "ms-1-m1", 1, "Audit v2 endpoint usage", "accepted", ["api", "analytics"], 18, 88, "T-1"),
    tk("task-acme-1-t2", "ms-1-m1", 2, "Capture undocumented behaviors", "accepted", ["api"], 12, 85, "T-2"),
    tk("task-acme-1-t3", "ms-1-m2", 3, "Draft v3 resource schemas", "in_progress", ["openapi", "typescript"], 24, 82, "T-3"),
    tk("task-acme-1-t4", "ms-1-m2", 4, "Pagination + error model", "in_progress", ["api"], 16, 80, "T-4"),
    { ...tk("task-acme-1-t5", "ms-1-m3", 5, "UI polish — dashboard filters", "ready", ["figma", "react"], 20, 75, "T-5"), workforceSourcing: "internal_only", reviewPath: "internal" },
    { ...tk("task-acme-1-t6", "ms-1-m3", 6, "Rollback runbook", "ready", ["sre"], 8, 78, "T-6"), workforceSourcing: "internal_first", reviewPath: "internal" },
  ],
  dependencies: [
    { id: "dep-1-1", fromTaskId: "task-acme-1-t1", toTaskId: "task-acme-1-t3", type: "finish_to_start", createdAt: iso(20) },
    { id: "dep-1-2", fromTaskId: "task-acme-1-t2", toTaskId: "task-acme-1-t3", type: "finish_to_start", createdAt: iso(20) },
    { id: "dep-1-3", fromTaskId: "task-acme-1-t3", toTaskId: "task-acme-1-t5", type: "finish_to_start", createdAt: iso(20) },
    { id: "dep-1-4", fromTaskId: "task-acme-1-t4", toTaskId: "task-acme-1-t5", type: "finish_to_start", createdAt: iso(20) },
    { id: "dep-1-5", fromTaskId: "task-acme-1-t5", toTaskId: "task-acme-1-t6", type: "finish_to_start", createdAt: iso(20) },
  ],
};

const PLAN_5: PlanDetail = {
  id: "plan-acme-5",
  sowId: "sow-acme-5",
  version: 1,
  status: "active",
  summary: "6 milestones · 18 tasks · ~360 hours",
  ...PLAN_DEFAULTS,
  approvedAt: iso(40),
  approvedBy: OWNER,
  activatedAt: iso(38),
  archivedAt: null,
  createdBy: OWNER,
  createdAt: iso(45),
  updatedAt: iso(2),
  milestones: [
    ms("ms-5-m1", 1, "Roles + RBAC matrix", "completed", 40, 30),
    ms("ms-5-m2", 2, "Self-serve add user flow", "in_progress", 30, -5),
    ms("ms-5-m3", 3, "SSO + SCIM hardening", "pending", -5, -20),
  ],
  tasks: [
    tk("task-5-t1", "ms-5-m1", 1, "Define role catalog", "accepted", ["product", "rbac"], 14, 84),
    tk("task-5-t2", "ms-5-m2", 2, "Add-user wizard UX", "in_progress", ["react", "design"], 22, 81),
    tk("task-5-t3", "ms-5-m3", 3, "SCIM connector tests", "ready", ["nodejs"], 18, 76),
  ],
  dependencies: [],
};

const PLAN_10: PlanDetail = {
  id: "plan-acme-10",
  sowId: "sow-acme-10",
  version: 1,
  status: "approved",
  summary: "5 milestones · 14 tasks · ~280 hours",
  ...PLAN_DEFAULTS,
  approvedAt: iso(50),
  approvedBy: OWNER,
  activatedAt: null,
  archivedAt: null,
  createdBy: OWNER,
  createdAt: iso(60),
  updatedAt: iso(50),
  milestones: [
    ms("ms-10-m1", 1, "Provisioning policy", "completed", 55, 45),
    ms("ms-10-m2", 2, "API endpoints", "completed", 45, 30),
  ],
  tasks: [
    tk("task-10-t1", "ms-10-m1", 1, "Draft RBAC policy doc", "accepted", ["governance"], 10, 82),
    tk("task-10-t2", "ms-10-m2", 2, "/users POST endpoint", "accepted", ["api"], 14, 84),
  ],
  dependencies: [],
};

const PLAN_2: PlanDetail = {
  id: "plan-acme-2",
  sowId: "sow-acme-2",
  version: 1,
  status: "draft",
  summary: "4 milestones · 11 tasks · ~210 hours (AI draft)",
  ...PLAN_DEFAULTS,
  approvedAt: null,
  approvedBy: null,
  activatedAt: null,
  archivedAt: null,
  createdBy: OWNER,
  createdAt: iso(5),
  updatedAt: iso(2),
  milestones: [
    ms("ms-2-m1", 1, "Onboarding flow audit", "pending", 4, -3),
    ms("ms-2-m2", 2, "Welcome experience", "pending", -3, -15),
  ],
  tasks: [
    tk("task-2-t1", "ms-2-m1", 1, "User interviews (n=8)", "draft", ["research"], 12, 78),
    tk("task-2-t2", "ms-2-m2", 2, "Welcome modal design", "draft", ["figma"], 14, 80),
  ],
  dependencies: [],
};

const PLAN_7: PlanDetail = {
  id: "plan-acme-7",
  sowId: "sow-acme-7",
  version: 1,
  status: "draft",
  summary: "3 milestones · 9 tasks · ~180 hours (AI draft)",
  ...PLAN_DEFAULTS,
  approvedAt: null,
  approvedBy: null,
  activatedAt: null,
  archivedAt: null,
  createdBy: OWNER,
  createdAt: iso(7),
  updatedAt: iso(3),
  milestones: [ms("ms-7-m1", 1, "Pricing rules engine", "pending", 7, -7)],
  tasks: [
    tk("task-7-t1", "ms-7-m1", 1, "Engine spec + ADR", "draft", ["architecture"], 16, 79),
    tk("task-7-t2", "ms-7-m1", 2, "Rule registry table", "draft", ["postgres"], 10, 82),
  ],
  dependencies: [],
};

const PLAN_OLD: PlanDetail = {
  id: "plan-acme-archived-1",
  sowId: "sow-acme-1",
  version: 0,
  status: "archived",
  summary: "Superseded by v1 — kept for audit.",
  ...PLAN_DEFAULTS,
  approvedAt: null,
  approvedBy: null,
  activatedAt: null,
  archivedAt: iso(35),
  createdBy: OWNER,
  createdAt: iso(40),
  updatedAt: iso(35),
  milestones: [],
  tasks: [],
  dependencies: [],
};

const SEED: PlanDetail[] = [PLAN_1, PLAN_2, PLAN_5, PLAN_7, PLAN_10, PLAN_OLD];

/* ────────────────────────── store + accessors ─────────────────────── */

const overlay = createOverlayStore<PlanDetail>("glimmora.mock.plans.v1");

function allMerged(): PlanDetail[] {
  return applyOverlay<PlanDetail>(SEED, overlay.read());
}

function toSummary(p: PlanDetail): PlanSummary {
  const { milestones: _m, tasks: _t, dependencies: _d, ...rest } = p;
  return rest;
}

export function listPlansMock(params: {
  sowId?: string;
  status?: PlanStatus | PlanStatus[];
  includeArchived?: boolean;
  limit?: number;
} = {}): { items: PlanSummary[]; nextCursor: string | null } {
  let items = allMerged().map(toSummary);
  if (params.sowId) items = items.filter((p) => p.sowId === params.sowId);
  if (params.status) {
    const allowed = Array.isArray(params.status) ? new Set(params.status) : new Set([params.status]);
    items = items.filter((p) => allowed.has(p.status));
  }
  if (!params.includeArchived) items = items.filter((p) => p.status !== "archived");
  items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  if (params.limit) items = items.slice(0, params.limit);
  return { items, nextCursor: null };
}

export function getPlanMock(id: string): PlanDetail | undefined {
  return allMerged().find((p) => p.id === id);
}

export function createPlanMock(input: CreatePlanInput): PlanDetail {
  const id = `plan-acme-${Date.now().toString(36)}`;
  const now = new Date().toISOString();
  const milestones: MilestoneDetail[] = (input.structure?.milestones ?? []).map((m, i) => ({
    id: `ms-${id}-${i}`,
    order: m.order ?? i + 1,
    name: m.name,
    description: m.description ?? null,
    startDate: m.startDate ?? null,
    endDate: m.endDate ?? null,
    status: m.status ?? "pending",
    createdAt: now,
    updatedAt: now,
  }));
  const tasks: TaskDetail[] = (input.structure?.tasks ?? []).map((t, i) => ({
    id: `task-${id}-${i}`,
    milestoneId: t.milestoneKey ? milestones.find((m) => m.name === t.milestoneKey)?.id ?? null : null,
    externalKey: t.externalKey ?? null,
    title: t.title,
    description: t.description ?? null,
    requiredSkills: t.requiredSkills ?? [],
    estimatedHours: t.estimatedHours ?? null,
    acceptanceCriteria: t.acceptanceCriteria ?? null,
    complexity: t.complexity ?? null,
    order: t.order ?? i + 1,
    status: "draft",
    aiConfidence: t.aiConfidence ?? null,
    pmoEdited: t.pmoEdited ?? false,
    workforceSourcing: t.workforceSourcing ?? null,
    reviewPath: t.reviewPath ?? null,
    createdAt: now,
    updatedAt: now,
  }));
  const dependencies: DependencyDetail[] = [];
  const plan: PlanDetail = {
    id,
    sowId: input.sowId,
    version: 1,
    status: "draft",
    summary: input.summary ?? `${milestones.length} milestones · ${tasks.length} tasks`,
    ...PLAN_DEFAULTS,
    approvedAt: null,
    approvedBy: null,
    activatedAt: null,
    archivedAt: null,
    createdBy: OWNER,
    createdAt: now,
    updatedAt: now,
    milestones,
    tasks,
    dependencies,
  };
  overlay.insert(id, plan);
  return plan;
}

function transition(id: string, patch: Partial<PlanDetail>): PlanDetail {
  const current = getPlanMock(id);
  if (!current) throw new Error(`Plan ${id} not found`);
  const merged: PlanDetail = { ...current, ...patch, updatedAt: new Date().toISOString() };
  overlay.patch(id, merged);
  return merged;
}

export function updatePlanMock(id: string, input: UpdatePlanInput): PlanDetail {
  return transition(id, {
    summary: input.summary ?? undefined,
  });
}

export function approvePlanMock(id: string): PlanDetail {
  const approved = transition(id, { status: "approved", approvedAt: new Date().toISOString(), approvedBy: OWNER });
  // Chain: approving a plan provisions a delivery project (idempotent per planId).
  try {
    const sow = getSowMock(approved.sowId);
    provisionProjectFromPlanMock(approved, {
      sowTitle: sow?.title,
    });
  } catch {
    // provisioning is best-effort in the mock layer — never block approval
  }
  return approved;
}

export function activatePlanMock(id: string): PlanDetail {
  return transition(id, { status: "active", activatedAt: new Date().toISOString() });
}

export function archivePlanMock(id: string): PlanDetail {
  return transition(id, { status: "archived", archivedAt: new Date().toISOString() });
}

export function copyPlanMock(id: string): PlanDetail {
  const src = getPlanMock(id);
  if (!src) throw new Error(`Plan ${id} not found`);
  const newId = `plan-acme-${Date.now().toString(36)}`;
  const now = new Date().toISOString();
  const copy: PlanDetail = {
    ...src,
    id: newId,
    version: src.version + 1,
    status: "draft",
    approvedAt: null,
    approvedBy: null,
    activatedAt: null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  overlay.insert(newId, copy);
  return copy;
}

export { overlay as planOverlay };
