/**
 *   GET   /api/decomposition/plans/:planId   → full detail
 *   PATCH /api/decomposition/plans/:planId   → update meta / replace structure
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenantRequest } from "@/lib/api/request-context";
import { userHasPermission } from "@/lib/auth/permissions";
import {
  getPlanDetail,
  updatePlan,
  DecompositionServiceError,
} from "@/lib/decomposition";
import { planStructureSchema } from "../route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchBody = z.object({
  summary: z.string().max(2000).optional(),
  structure: planStructureSchema.optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  const { planId } = await params;
  if (!planId) return NextResponse.json({ error: "Missing planId" }, { status: 400 });

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

  try {
    const plan = await ctx.withTx((tx) => getPlanDetail(tx, planId));
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }
    return NextResponse.json({ plan }, { status: 200 });
  } catch (err) {
    return mapServiceError(err, "[decomp.plan.GET id]");
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  const { planId } = await params;
  if (!planId) return NextResponse.json({ error: "Missing planId" }, { status: 400 });

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
  const parsed = patchBody.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  if (parsed.data.summary === undefined && parsed.data.structure === undefined) {
    return NextResponse.json(
      { error: "Request body must include summary and/or structure" },
      { status: 400 },
    );
  }

  try {
    const plan = await ctx.withTx(async (tx) => {
      const before = await getPlanDetail(tx, planId);
      if (!before) {
        throw new DecompositionServiceError("Plan not found", "not_found");
      }
      const updated = await updatePlan(tx, { planId, input: parsed.data });
      await ctx.audit(
        {
          action: "decomposition.plan.update",
          resource: {
            type: "decomposition_plan",
            id: planId,
            label: `Plan v${updated.version}`,
          },
          payload: {
            summaryChanged: parsed.data.summary !== undefined,
            structureReplaced: parsed.data.structure !== undefined,
            previousCounts: {
              milestones: before.milestones.length,
              tasks: before.tasks.length,
              dependencies: before.dependencies.length,
            },
            newCounts: {
              milestones: updated.milestones.length,
              tasks: updated.tasks.length,
              dependencies: updated.dependencies.length,
            },
          },
          severity: "info",
        },
        { tx },
      );
      return updated;
    });
    return NextResponse.json({ plan }, { status: 200 });
  } catch (err) {
    return mapServiceError(err, "[decomp.plan.PATCH]");
  }
}

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
