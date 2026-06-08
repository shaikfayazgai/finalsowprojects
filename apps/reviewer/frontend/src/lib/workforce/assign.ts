/**
 * Task assignment with workforce sourcing + review-path derivation.
 */

import { Prisma } from "@/generated/prisma/client";
import {
  deriveReviewPath,
  deriveWorkforceSourcing,
  parseTenantWorkforcePolicy,
} from "./policies";
import type {
  AssignTaskInput,
  AssignTaskResult,
  ReassignTaskInput,
  ReviewPath,
  WorkforceSourcing,
} from "./types";

type Tx = Prisma.TransactionClient;

export class WorkforceAssignError extends Error {
  constructor(
    message: string,
    public code:
      | "not_found"
      | "validation"
      | "forbidden"
      | "invalid_state"
      | "conflict",
  ) {
    super(message);
    this.name = "WorkforceAssignError";
  }
}

type RateCardsJson = {
  currency?: string;
  default?: number;
  bySegment?: Record<string, number>;
};

function segmentKey(contribType: string): string {
  if (contribType === "women_workforce") return "women_workforce";
  if (contribType === "student") return "student";
  if (contribType === "internal") return "internal";
  return "general_workforce";
}

async function resolveAgreedRate(
  tx: Tx,
  tenantId: string,
  contribType: string,
): Promise<{ agreedRatePerHour: number | null; agreedCurrency: string }> {
  const tenant = await tx.tenant.findUnique({
    where: { id: tenantId },
    select: { rateCards: true, currency: true },
  });
  const cards = (tenant?.rateCards ?? null) as RateCardsJson | null;
  const key = segmentKey(contribType);
  const rate =
    cards?.bySegment?.[key] ??
    cards?.default ??
    null;
  return {
    agreedRatePerHour: rate,
    agreedCurrency: cards?.currency ?? tenant?.currency ?? "INR",
  };
}

function assertSourcingAllowsAssign(args: {
  workforceSourcing: WorkforceSourcing | null;
  contribType: string;
  userTenantId: string | null;
  taskTenantId: string;
}): void {
  const isInternal =
    args.contribType === "internal" && args.userTenantId === args.taskTenantId;
  const sourcing = args.workforceSourcing ?? "open";

  if (sourcing === "internal_only" && !isInternal) {
    throw new WorkforceAssignError(
      "This task is internal-only — assign from My organization",
      "validation",
    );
  }
  if (sourcing === "external_only" && isInternal) {
    throw new WorkforceAssignError(
      "This task is external-only — cannot assign an internal employee",
      "validation",
    );
  }
}

async function loadTaskContext(tx: Tx, taskId: string) {
  const task = await tx.taskDefinition.findFirst({
    where: { id: taskId },
    include: {
      plan: {
        select: {
          defaultWorkforceSourcing: true,
          defaultReviewPath: true,
          twoStageReviewEnabled: true,
        },
      },
      tenant: { select: { workforcePolicy: true } },
    },
  });
  if (!task) {
    throw new WorkforceAssignError("Task not found in tenant scope", "not_found");
  }
  return task;
}

function effectiveWorkforceSourcing(task: {
  workforceSourcing: string | null;
  plan: { defaultWorkforceSourcing: string | null };
}): WorkforceSourcing | null {
  const raw =
    task.workforceSourcing ??
    (task.plan.defaultWorkforceSourcing === "hybrid"
      ? null
      : task.plan.defaultWorkforceSourcing);
  return raw as WorkforceSourcing | null;
}

export async function assignTaskWithWorkforcePolicy(
  tx: Tx,
  args: AssignTaskInput,
): Promise<AssignTaskResult> {
  const task = await loadTaskContext(tx, args.taskId);

  if (task.status !== "ready" && task.status !== "matched") {
    throw new WorkforceAssignError(
      `Cannot assign a task in '${task.status}' state — must be 'ready' or 'matched'`,
      "invalid_state",
    );
  }

  const contrib = await tx.user.findUnique({
    where: { id: args.contributorUserId },
    select: {
      id: true,
      role: true,
      tenantId: true,
      contributorProfile: { select: { contribType: true } },
    },
  });
  if (!contrib || contrib.role !== "contributor") {
    throw new WorkforceAssignError("Target user is not a contributor", "validation");
  }

  const contribType = contrib.contributorProfile?.contribType ?? "general_workforce";
  const workforceSourcing = effectiveWorkforceSourcing(task);

  assertSourcingAllowsAssign({
    workforceSourcing,
    contribType,
    userTenantId: contrib.tenantId,
    taskTenantId: task.tenantId,
  });

  const policy = parseTenantWorkforcePolicy(task.tenant.workforcePolicy);
  let reviewPath: ReviewPath =
    (task.reviewPath as ReviewPath | null) ??
    (task.plan.defaultReviewPath as ReviewPath | null) ??
    deriveReviewPath(contribType);

  if (policy.requireMentorForInternal && contribType === "internal") {
    reviewPath = "mentor_then_internal";
  }

  const { agreedRatePerHour, agreedCurrency } = await resolveAgreedRate(
    tx,
    task.tenantId,
    contribType,
  );

  const now = new Date();
  await tx.taskDefinition.update({
    where: { id: task.id },
    data: {
      assignedContributorId: args.contributorUserId,
      assignedAt:
        task.assignedContributorId === args.contributorUserId ? task.assignedAt : now,
      status: "matched",
      reviewPath,
      workforceSourcing:
        task.workforceSourcing ??
        workforceSourcing ??
        deriveWorkforceSourcing(contribType),
      agreedRatePerHour,
      agreedCurrency,
    },
  });

  return {
    taskId: task.id,
    contributorId: args.contributorUserId,
    reviewPath,
    workforceSourcing: (task.workforceSourcing ??
      workforceSourcing ??
      deriveWorkforceSourcing(contribType)) as WorkforceSourcing | null,
  };
}

export async function reassignTaskWithWorkforcePolicy(
  tx: Tx,
  args: ReassignTaskInput,
): Promise<AssignTaskResult> {
  const task = await loadTaskContext(tx, args.taskId);

  if (
    task.status !== "matched" &&
    task.status !== "in_progress" &&
    task.status !== "ready"
  ) {
    throw new WorkforceAssignError(
      `Cannot reassign a task in '${task.status}' state`,
      "invalid_state",
    );
  }

  if (task.assignedContributorId === args.contributorUserId) {
    throw new WorkforceAssignError(
      "Contributor is already assigned to this task",
      "conflict",
    );
  }

  await tx.taskDefinition.update({
    where: { id: task.id },
    data: {
      assignedContributorId: null,
      assignedAt: null,
      acceptedAt: null,
      status: "ready",
    },
  });

  return assignTaskWithWorkforcePolicy(tx, {
    taskId: args.taskId,
    contributorUserId: args.contributorUserId,
    directAssign: true,
    actorUserId: args.actorUserId,
  });
}
