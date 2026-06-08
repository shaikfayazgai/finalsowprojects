/**
 * Decomposition plans collection endpoint.
 *
 *   POST /api/decomposition/plans     → create draft plan (optionally with structure)
 *   GET  /api/decomposition/plans     → list plans in tenant scope
 *
 * Permissions:
 *   - POST → manage.decomposition_plan
 *   - GET  → read.decomposition_plan
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenantRequest } from "@/lib/api/request-context";
import { userHasPermission } from "@/lib/auth/permissions";
import {
  createPlan,
  listPlans,
  DecompositionServiceError,
  type PlanStatus,
} from "@/lib/decomposition";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const milestoneInputSchema = z.object({
  key: z.string().min(1).max(64).optional(),
  order: z.number().int().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z
    .enum(["pending", "in_progress", "completed", "at_risk", "blocked"])
    .optional(),
});

const taskInputSchema = z.object({
  key: z.string().min(1).max(64).optional(),
  milestoneKey: z.string().min(1).max(64).optional(),
  externalKey: z.string().max(64).optional(),
  title: z.string().min(1).max(300),
  description: z.string().max(20_000).optional(),
  requiredSkills: z.array(z.string().min(1).max(120)).max(50).optional(),
  estimatedHours: z.number().min(0).max(10_000).optional(),
  acceptanceCriteria: z.string().max(10_000).optional(),
  complexity: z.string().max(32).optional(),
  order: z.number().int().min(0).optional(),
  aiConfidence: z.number().int().min(0).max(100).optional(),
  pmoEdited: z.boolean().optional(),
});

const dependencyInputSchema = z.object({
  fromTaskKey: z.string().min(1).max(64),
  toTaskKey: z.string().min(1).max(64),
  type: z
    .enum(["finish_to_start", "start_to_start", "finish_to_finish"])
    .optional(),
});

const planStructureSchema = z.object({
  milestones: z.array(milestoneInputSchema).max(50),
  tasks: z.array(taskInputSchema).max(500),
  dependencies: z.array(dependencyInputSchema).max(1000),
});

const createBody = z.object({
  sowId: z.string().min(1),
  summary: z.string().max(2000).optional(),
  sourceAgentInvocationId: z.string().min(1).optional(),
  structure: planStructureSchema.optional(),
});

/* ────────────────────────────── POST ───────────────────────────────── */

export async function POST(req: NextRequest) {
  const ctx = await requireTenantRequest({
    allowedRoles: ["enterprise", "admin", "super_admin"],
  });
  if (ctx instanceof NextResponse) return ctx;

  if (!(await userHasPermission(ctx.userId, "manage.decomposition_plan"))) {
    return NextResponse.json(
      { error: "forbidden", reason: "missing_permission:manage.decomposition_plan" },
      { status: 403 },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = createBody.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const plan = await ctx.withTx(async (tx) => {
      const created = await createPlan(tx, {
        tenantId: ctx.tenant.id,
        createdBy: ctx.userId,
        input: parsed.data,
      });
      await ctx.audit(
        {
          action: "decomposition.plan.create",
          resource: {
            type: "decomposition_plan",
            id: created.id,
            label: `Plan v${created.version} for ${created.sowId}`,
          },
          payload: {
            sowId: created.sowId,
            version: created.version,
            milestoneCount: created.milestones.length,
            taskCount: created.tasks.length,
            depCount: created.dependencies.length,
            sourceAgentInvocationId: parsed.data.sourceAgentInvocationId ?? null,
          },
          severity: "info",
        },
        { tx },
      );
      return created;
    });
    return NextResponse.json({ plan }, { status: 201 });
  } catch (err) {
    return mapServiceError(err, "[decomp.plan.POST]");
  }
}

/* ─────────────────────────────── GET ───────────────────────────────── */

const STATUSES = [
  "draft",
  "approved",
  "active",
  "archived",
] as const satisfies readonly PlanStatus[];

export async function GET(req: NextRequest) {
  const ctx = await requireTenantRequest({
    allowedRoles: ["enterprise", "admin", "super_admin"],
  });
  if (ctx instanceof NextResponse) return ctx;

  if (!(await userHasPermission(ctx.userId, "read.decomposition_plan"))) {
    return NextResponse.json(
      { error: "forbidden", reason: "missing_permission:read.decomposition_plan" },
      { status: 403 },
    );
  }

  const url = new URL(req.url);
  const sowId = url.searchParams.get("sowId") ?? undefined;
  const statusParams = url.searchParams.getAll("status");
  const includeArchived = url.searchParams.get("includeArchived") === "true";
  const limit = Number(url.searchParams.get("limit") ?? "50");
  const cursor = url.searchParams.get("cursor") ?? undefined;

  const invalidStatus = statusParams.find(
    (s) => !STATUSES.includes(s as PlanStatus),
  );
  if (invalidStatus) {
    return NextResponse.json(
      { error: `Invalid status: ${invalidStatus}` },
      { status: 400 },
    );
  }

  try {
    const result = await ctx.withTx((tx) =>
      listPlans(tx, {
        tenantId: ctx.tenant.id,
        sowId,
        status:
          statusParams.length === 0
            ? undefined
            : statusParams.length === 1
              ? (statusParams[0] as PlanStatus)
              : (statusParams as PlanStatus[]),
        includeArchived,
        limit: Number.isFinite(limit) ? limit : 50,
        cursor,
      }),
    );
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return mapServiceError(err, "[decomp.plan.GET]");
  }
}

/* ─────────────────────────── error mapping ─────────────────────────── */

function mapServiceError(err: unknown, logTag: string): NextResponse {
  if (err instanceof DecompositionServiceError) {
    const status =
      err.code === "not_found"
        ? 404
        : err.code === "forbidden"
          ? 403
          : err.code === "validation" || err.code === "invalid_state"
            ? 400
            : err.code === "conflict"
              ? 409
              : 500;
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status },
    );
  }
  // eslint-disable-next-line no-console
  console.error(logTag, err);
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}

export {
  planStructureSchema,
  milestoneInputSchema,
  taskInputSchema,
  dependencyInputSchema,
};
