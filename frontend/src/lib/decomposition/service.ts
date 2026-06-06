/**
 * Decomposition service — server-side functions for the SOW
 * decomposition lifecycle. Each function expects a Prisma transaction
 * with `app.tenant_id` already bound for RLS scope.
 *
 * Design:
 *   - The plan is the atomic unit of mutation. Granular row edits
 *     happen client-side; the API commits the whole structure on save.
 *     This matches the "AI agent produces a tree → PMO refines → one
 *     save" wizard flow and keeps the dependency graph trivially
 *     consistent at every persisted state.
 *   - `updatePlan({ structure })` replaces all milestones/tasks/deps
 *     atomically. The old rows are deleted, the new ones inserted
 *     within the same transaction.
 *   - Validation includes: client-key uniqueness, task→milestone key
 *     references, dependency endpoint references, and DAG cycle
 *     detection.
 */

import { Prisma } from "@/generated/prisma/client";
import type {
  CreatePlanInput,
  DependencyDetail,
  DependencyInput,
  DependencyType,
  MilestoneDetail,
  MilestoneInput,
  MilestoneStatus,
  PlanDetail,
  PlanStatus,
  PlanStructureInput,
  PlanSummary,
  TaskDetail,
  TaskInput,
  TaskStatus,
  UpdatePlanInput,
} from "./types";

type Tx = Prisma.TransactionClient;

export class DecompositionServiceError extends Error {
  constructor(
    message: string,
    public code:
      | "not_found"
      | "invalid_state"
      | "forbidden"
      | "validation"
      | "conflict",
  ) {
    super(message);
    this.name = "DecompositionServiceError";
  }
}

/* ─────────────────────────── Mappers ─────────────────────────── */

function toIso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

function toPlanSummary(row: {
  id: string;
  sowId: string;
  version: number;
  status: string;
  summary: string | null;
  defaultWorkforceSourcing?: string | null;
  defaultReviewPath?: string | null;
  twoStageReviewEnabled?: boolean;
  approvedAt: Date | null;
  approvedBy: string | null;
  activatedAt: Date | null;
  archivedAt: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}): PlanSummary {
  return {
    id: row.id,
    sowId: row.sowId,
    version: row.version,
    status: row.status as PlanStatus,
    summary: row.summary,
    defaultWorkforceSourcing: row.defaultWorkforceSourcing ?? null,
    defaultReviewPath: row.defaultReviewPath ?? null,
    twoStageReviewEnabled: row.twoStageReviewEnabled ?? false,
    approvedAt: toIso(row.approvedAt),
    approvedBy: row.approvedBy,
    activatedAt: toIso(row.activatedAt),
    archivedAt: toIso(row.archivedAt),
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toMilestone(row: {
  id: string;
  order: number;
  name: string;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): MilestoneDetail {
  return {
    id: row.id,
    order: row.order,
    name: row.name,
    description: row.description,
    startDate: toIso(row.startDate),
    endDate: toIso(row.endDate),
    status: row.status as MilestoneStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toTask(row: {
  id: string;
  milestoneId: string | null;
  externalKey: string | null;
  title: string;
  description: string | null;
  requiredSkills: string[];
  estimatedHours: number | null;
  acceptanceCriteria: string | null;
  complexity: string | null;
  order: number;
  status: string;
  aiConfidence: number | null;
  pmoEdited: boolean;
  workforceSourcing?: string | null;
  reviewPath?: string | null;
  createdAt: Date;
  updatedAt: Date;
}): TaskDetail {
  return {
    id: row.id,
    milestoneId: row.milestoneId,
    externalKey: row.externalKey,
    title: row.title,
    description: row.description,
    requiredSkills: row.requiredSkills,
    estimatedHours: row.estimatedHours,
    acceptanceCriteria: row.acceptanceCriteria,
    complexity: row.complexity,
    order: row.order,
    status: row.status as TaskStatus,
    aiConfidence: row.aiConfidence,
    pmoEdited: row.pmoEdited,
    workforceSourcing: (row.workforceSourcing ?? null) as TaskDetail["workforceSourcing"],
    reviewPath: (row.reviewPath ?? null) as TaskDetail["reviewPath"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toDependency(row: {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  type: string;
  createdAt: Date;
}): DependencyDetail {
  return {
    id: row.id,
    fromTaskId: row.fromTaskId,
    toTaskId: row.toTaskId,
    type: row.type as DependencyType,
    createdAt: row.createdAt.toISOString(),
  };
}

/* ─────────────────────── Structure validation ─────────────────────── */

function validateStructure(structure: PlanStructureInput): void {
  // 1. Milestone keys + orders unique
  const msKeys = new Map<string, MilestoneInput>();
  const msOrders = new Set<number>();
  for (const m of structure.milestones) {
    if (!m.name.trim()) {
      throw new DecompositionServiceError("milestone name required", "validation");
    }
    if (msOrders.has(m.order)) {
      throw new DecompositionServiceError(
        `duplicate milestone order: ${m.order}`,
        "validation",
      );
    }
    msOrders.add(m.order);
    if (m.key) {
      if (msKeys.has(m.key)) {
        throw new DecompositionServiceError(
          `duplicate milestone key: ${m.key}`,
          "validation",
        );
      }
      msKeys.set(m.key, m);
    }
  }

  // 2. Task keys unique; milestoneKey refs valid
  const taskKeys = new Map<string, TaskInput>();
  for (const t of structure.tasks) {
    if (!t.title.trim()) {
      throw new DecompositionServiceError("task title required", "validation");
    }
    if (t.key) {
      if (taskKeys.has(t.key)) {
        throw new DecompositionServiceError(
          `duplicate task key: ${t.key}`,
          "validation",
        );
      }
      taskKeys.set(t.key, t);
    }
    if (t.milestoneKey && !msKeys.has(t.milestoneKey)) {
      throw new DecompositionServiceError(
        `task references unknown milestoneKey: ${t.milestoneKey}`,
        "validation",
      );
    }
  }

  // 3. Dependencies must reference real task keys
  for (const d of structure.dependencies) {
    if (!taskKeys.has(d.fromTaskKey)) {
      throw new DecompositionServiceError(
        `dependency fromTaskKey unknown: ${d.fromTaskKey}`,
        "validation",
      );
    }
    if (!taskKeys.has(d.toTaskKey)) {
      throw new DecompositionServiceError(
        `dependency toTaskKey unknown: ${d.toTaskKey}`,
        "validation",
      );
    }
    if (d.fromTaskKey === d.toTaskKey) {
      throw new DecompositionServiceError(
        `dependency cannot point at itself: ${d.fromTaskKey}`,
        "validation",
      );
    }
  }

  // 4. DAG cycle detection — DFS over the dependency graph
  const adjacency = new Map<string, string[]>();
  for (const d of structure.dependencies) {
    if (!adjacency.has(d.fromTaskKey)) adjacency.set(d.fromTaskKey, []);
    adjacency.get(d.fromTaskKey)!.push(d.toTaskKey);
  }
  const WHITE = 0,
    GRAY = 1,
    BLACK = 2;
  const color = new Map<string, number>();
  for (const k of taskKeys.keys()) color.set(k, WHITE);

  const dfs = (node: string): void => {
    color.set(node, GRAY);
    for (const next of adjacency.get(node) ?? []) {
      const c = color.get(next) ?? WHITE;
      if (c === GRAY) {
        throw new DecompositionServiceError(
          `dependency cycle detected: ${node} → ${next}`,
          "validation",
        );
      }
      if (c === WHITE) dfs(next);
    }
    color.set(node, BLACK);
  };
  for (const node of taskKeys.keys()) {
    if ((color.get(node) ?? WHITE) === WHITE) dfs(node);
  }
}

/* ──────────────────────── Structure write ──────────────────────── */

/**
 * Internal: write milestones + tasks + dependencies for a plan in
 * one go. Assumes prior rows have been deleted (or the plan is
 * brand-new). Returns nothing — caller re-fetches via getPlanDetail.
 */
async function writeStructure(
  tx: Tx,
  args: {
    planId: string;
    tenantId: string;
    structure: PlanStructureInput;
  },
): Promise<void> {
  const { planId, tenantId, structure } = args;

  // Insert milestones; build key → id map
  const msKeyToId = new Map<string, string>();
  for (const m of structure.milestones) {
    const row = await tx.milestone.create({
      data: {
        planId,
        tenantId,
        order: m.order,
        name: m.name,
        description: m.description ?? null,
        startDate: m.startDate ? new Date(m.startDate) : null,
        endDate: m.endDate ? new Date(m.endDate) : null,
        status: m.status ?? "pending",
      },
    });
    if (m.key) msKeyToId.set(m.key, row.id);
  }

  // Insert tasks; build key → id map
  const taskKeyToId = new Map<string, string>();
  for (const t of structure.tasks) {
    const milestoneId = t.milestoneKey ? msKeyToId.get(t.milestoneKey) ?? null : null;
    const row = await tx.taskDefinition.create({
      data: {
        planId,
        tenantId,
        milestoneId,
        externalKey: t.externalKey ?? null,
        title: t.title,
        description: t.description ?? null,
        requiredSkills: t.requiredSkills ?? [],
        estimatedHours: t.estimatedHours ?? null,
        acceptanceCriteria: t.acceptanceCriteria ?? null,
        complexity: t.complexity ?? null,
        order: t.order ?? 0,
        aiConfidence: t.aiConfidence ?? null,
        pmoEdited: t.pmoEdited ?? false,
        workforceSourcing: t.workforceSourcing ?? null,
        reviewPath: t.reviewPath ?? null,
      },
    });
    if (t.key) taskKeyToId.set(t.key, row.id);
  }

  // Insert dependencies — at this point all task keys map to real IDs
  for (const d of structure.dependencies) {
    const fromTaskId = taskKeyToId.get(d.fromTaskKey)!;
    const toTaskId = taskKeyToId.get(d.toTaskKey)!;
    await tx.taskDependency.create({
      data: {
        fromTaskId,
        toTaskId,
        tenantId,
        type: d.type ?? "finish_to_start",
      },
    });
  }
}

/* ─────────────────────────── Reads ─────────────────────────── */

export async function getPlanDetail(
  tx: Tx,
  planId: string,
): Promise<PlanDetail | null> {
  const plan = await tx.decompositionPlan.findFirst({
    where: { id: planId, deletedAt: null },
  });
  if (!plan) return null;

  const [milestones, tasks, deps] = await Promise.all([
    tx.milestone.findMany({
      where: { planId: plan.id },
      orderBy: { order: "asc" },
    }),
    tx.taskDefinition.findMany({
      where: { planId: plan.id },
      orderBy: [{ milestoneId: "asc" }, { order: "asc" }],
    }),
    tx.taskDependency.findMany({
      where: {
        OR: [
          { fromTask: { planId: plan.id } },
          { toTask: { planId: plan.id } },
        ],
      },
    }),
  ]);

  return {
    ...toPlanSummary(plan),
    milestones: milestones.map(toMilestone),
    tasks: tasks.map(toTask),
    dependencies: deps.map(toDependency),
  };
}

export interface ListPlansOptions {
  tenantId: string;
  sowId?: string;
  status?: PlanStatus | PlanStatus[];
  /** Default: archived plans hidden. */
  includeArchived?: boolean;
  limit?: number;
  cursor?: string;
}

export async function listPlans(
  tx: Tx,
  options: ListPlansOptions,
): Promise<{ items: PlanSummary[]; nextCursor: string | null }> {
  const limit = Math.min(options.limit ?? 50, 100);
  const statusFilter = options.status
    ? Array.isArray(options.status)
      ? { in: options.status }
      : options.status
    : options.includeArchived
      ? undefined
      : { not: "archived" };

  const rows = await tx.decompositionPlan.findMany({
    where: {
      tenantId: options.tenantId,
      deletedAt: null,
      ...(options.sowId ? { sowId: options.sowId } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy: [{ sowId: "asc" }, { version: "desc" }],
    take: limit + 1,
    ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > limit;
  const items = (hasMore ? rows.slice(0, limit) : rows).map(toPlanSummary);
  const nextCursor = hasMore ? rows[limit - 1].id : null;
  return { items, nextCursor };
}

/* ─────────────────────────── Writes ─────────────────────────── */

/**
 * Create a new draft plan. Picks the next monotonic version per
 * (sowId). If `structure` is supplied, populates milestones/tasks/
 * deps atomically.
 */
export async function createPlan(
  tx: Tx,
  args: {
    tenantId: string;
    createdBy: string;
    input: CreatePlanInput;
  },
): Promise<PlanDetail> {
  const { tenantId, createdBy, input } = args;

  // Verify SOW exists in scope; RLS hides it if cross-tenant.
  const sow = await tx.sow.findFirst({
    where: { id: input.sowId, deletedAt: null },
    select: { id: true },
  });
  if (!sow) {
    throw new DecompositionServiceError(
      "SOW not found in tenant scope",
      "not_found",
    );
  }

  if (input.structure) validateStructure(input.structure);

  // Pick next version
  const existing = await tx.decompositionPlan.findFirst({
    where: { sowId: input.sowId, tenantId, deletedAt: null },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const nextVersion = (existing?.version ?? 0) + 1;

  const plan = await tx.decompositionPlan.create({
    data: {
      sowId: input.sowId,
      tenantId,
      version: nextVersion,
      status: "draft",
      summary: input.summary ?? null,
      sourceAgentInvocationId: input.sourceAgentInvocationId ?? null,
      createdBy,
    },
  });

  if (input.structure) {
    await writeStructure(tx, {
      planId: plan.id,
      tenantId,
      structure: input.structure,
    });
  }

  return (await getPlanDetail(tx, plan.id))!;
}

/**
 * Update a plan. Only allowed when status === 'draft'. Updating
 * `structure` triggers an atomic replace: existing milestones/tasks/
 * deps are deleted and re-inserted from the supplied structure.
 */
export async function updatePlan(
  tx: Tx,
  args: { planId: string; input: UpdatePlanInput },
): Promise<PlanDetail> {
  const { planId, input } = args;
  const plan = await tx.decompositionPlan.findFirst({
    where: { id: planId, deletedAt: null },
  });
  if (!plan) throw new DecompositionServiceError("Plan not found", "not_found");
  if (plan.status !== "draft") {
    throw new DecompositionServiceError(
      `Cannot edit a plan in '${plan.status}' state`,
      "invalid_state",
    );
  }

  if (input.structure !== undefined) {
    validateStructure(input.structure);

    // Wipe existing structure; cascade handles tasks via planId.
    await tx.taskDependency.deleteMany({
      where: {
        OR: [
          { fromTask: { planId } },
          { toTask: { planId } },
        ],
      },
    });
    await tx.taskDefinition.deleteMany({ where: { planId } });
    await tx.milestone.deleteMany({ where: { planId } });

    await writeStructure(tx, {
      planId,
      tenantId: plan.tenantId,
      structure: input.structure,
    });
  }

  if (input.summary !== undefined) {
    await tx.decompositionPlan.update({
      where: { id: planId },
      data: { summary: input.summary },
    });
  }

  return (await getPlanDetail(tx, planId))!;
}

/**
 * Sponsor sign-off: draft → approved. Plan is now frozen.
 */
export async function approvePlan(
  tx: Tx,
  args: { planId: string; approverId: string },
): Promise<PlanDetail> {
  const plan = await tx.decompositionPlan.findFirst({
    where: { id: args.planId, deletedAt: null },
  });
  if (!plan) throw new DecompositionServiceError("Plan not found", "not_found");
  if (plan.status !== "draft") {
    throw new DecompositionServiceError(
      `Cannot approve a plan in '${plan.status}' state`,
      "invalid_state",
    );
  }
  const taskCount = await tx.taskDefinition.count({ where: { planId: plan.id } });
  if (taskCount === 0) {
    throw new DecompositionServiceError(
      "Cannot approve an empty plan — add at least one task",
      "invalid_state",
    );
  }

  await tx.decompositionPlan.update({
    where: { id: plan.id },
    data: {
      status: "approved",
      approvedAt: new Date(),
      approvedBy: args.approverId,
    },
  });

  return (await getPlanDetail(tx, plan.id))!;
}

/**
 * PMO provisions an approved plan: approved → active. Tasks become
 * eligible for matching/routing once active.
 */
export async function activatePlan(
  tx: Tx,
  args: { planId: string },
): Promise<PlanDetail> {
  const plan = await tx.decompositionPlan.findFirst({
    where: { id: args.planId, deletedAt: null },
  });
  if (!plan) throw new DecompositionServiceError("Plan not found", "not_found");
  if (plan.status !== "approved") {
    throw new DecompositionServiceError(
      `Cannot activate a plan in '${plan.status}' state — approve it first`,
      "invalid_state",
    );
  }

  await tx.decompositionPlan.update({
    where: { id: plan.id },
    data: { status: "active", activatedAt: new Date() },
  });
  // Flip child tasks to 'ready' so the matching engine can pick them up.
  await tx.taskDefinition.updateMany({
    where: { planId: plan.id, status: "draft" },
    data: { status: "ready" },
  });

  return (await getPlanDetail(tx, plan.id))!;
}

/**
 * Archive a plan (terminal). Allowed from draft, approved, or active.
 */
export async function archivePlan(
  tx: Tx,
  args: { planId: string },
): Promise<PlanDetail> {
  const plan = await tx.decompositionPlan.findFirst({
    where: { id: args.planId, deletedAt: null },
  });
  if (!plan) throw new DecompositionServiceError("Plan not found", "not_found");
  if (plan.status === "archived") {
    throw new DecompositionServiceError(
      "Plan is already archived",
      "invalid_state",
    );
  }

  await tx.decompositionPlan.update({
    where: { id: plan.id },
    data: { status: "archived", archivedAt: new Date() },
  });
  return (await getPlanDetail(tx, plan.id))!;
}

/**
 * Clone an existing plan as a new draft version of the same SOW.
 * Useful for "I want to iterate on v2 while v1 stays approved" or
 * "revive an archived plan".
 *
 * The clone has status='draft', a fresh version number, and a full
 * copy of milestones/tasks/deps. AI confidence + pmoEdited flags are
 * preserved.
 */
export async function copyPlanAsDraft(
  tx: Tx,
  args: { sourcePlanId: string; createdBy: string },
): Promise<PlanDetail> {
  const source = await getPlanDetail(tx, args.sourcePlanId);
  if (!source) throw new DecompositionServiceError("Plan not found", "not_found");

  // Pick next version under the same SOW
  const existing = await tx.decompositionPlan.findFirst({
    where: { sowId: source.sowId, deletedAt: null },
    orderBy: { version: "desc" },
    select: { version: true, tenantId: true },
  });
  const tenantId = existing?.tenantId;
  if (!tenantId) {
    // Should be impossible — getPlanDetail succeeded so the row exists.
    throw new DecompositionServiceError(
      "Could not determine tenant for clone",
      "conflict",
    );
  }
  const nextVersion = (existing?.version ?? 0) + 1;

  const newPlan = await tx.decompositionPlan.create({
    data: {
      sowId: source.sowId,
      tenantId,
      version: nextVersion,
      status: "draft",
      summary: source.summary,
      createdBy: args.createdBy,
    },
  });

  // Build structure input from source detail
  const milestoneIdToKey = new Map<string, string>();
  const milestones: MilestoneInput[] = source.milestones.map((m) => {
    const key = `m-${m.id}`;
    milestoneIdToKey.set(m.id, key);
    return {
      key,
      order: m.order,
      name: m.name,
      description: m.description ?? undefined,
      startDate: m.startDate ?? undefined,
      endDate: m.endDate ?? undefined,
      status: m.status,
    };
  });
  const taskIdToKey = new Map<string, string>();
  const tasks: TaskInput[] = source.tasks.map((t) => {
    const key = `t-${t.id}`;
    taskIdToKey.set(t.id, key);
    return {
      key,
      milestoneKey: t.milestoneId ? milestoneIdToKey.get(t.milestoneId) : undefined,
      externalKey: t.externalKey ?? undefined,
      title: t.title,
      description: t.description ?? undefined,
      requiredSkills: t.requiredSkills,
      estimatedHours: t.estimatedHours ?? undefined,
      acceptanceCriteria: t.acceptanceCriteria ?? undefined,
      complexity: t.complexity ?? undefined,
      order: t.order,
      aiConfidence: t.aiConfidence ?? undefined,
      pmoEdited: t.pmoEdited,
    };
  });
  const dependencies: DependencyInput[] = source.dependencies
    .filter(
      (d) => taskIdToKey.has(d.fromTaskId) && taskIdToKey.has(d.toTaskId),
    )
    .map((d) => ({
      fromTaskKey: taskIdToKey.get(d.fromTaskId)!,
      toTaskKey: taskIdToKey.get(d.toTaskId)!,
      type: d.type,
    }));

  await writeStructure(tx, {
    planId: newPlan.id,
    tenantId,
    structure: { milestones, tasks, dependencies },
  });

  return (await getPlanDetail(tx, newPlan.id))!;
}
