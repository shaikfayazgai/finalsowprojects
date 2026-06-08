/**
 * POST /api/decomposition/plans/:planId/copy
 *
 * Clone an existing plan as a new draft version under the same SOW.
 * Useful for revising an approved plan or reviving an archived one.
 *
 * Permission: manage.decomposition_plan
 */

import { NextRequest, NextResponse } from "next/server";
import { requireTenantRequest } from "@/lib/api/request-context";
import { userHasPermission } from "@/lib/auth/permissions";
import { copyPlanAsDraft, DecompositionServiceError } from "@/lib/decomposition";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
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

  try {
    const plan = await ctx.withTx(async (tx) => {
      const result = await copyPlanAsDraft(tx, {
        sourcePlanId: planId,
        createdBy: ctx.userId,
      });
      await ctx.audit(
        {
          action: "decomposition.plan.copy",
          resource: {
            type: "decomposition_plan",
            id: result.id,
            label: `Plan v${result.version}`,
          },
          payload: {
            sourcePlanId: planId,
            sowId: result.sowId,
            newVersion: result.version,
            milestoneCount: result.milestones.length,
            taskCount: result.tasks.length,
            depCount: result.dependencies.length,
          },
          severity: "info",
        },
        { tx },
      );
      return result;
    });
    return NextResponse.json({ plan }, { status: 201 });
  } catch (err) {
    return mapErr(err, "[decomp.plan.copy]");
  }
}

function mapErr(err: unknown, tag: string): NextResponse {
  if (err instanceof DecompositionServiceError) {
    const status =
      err.code === "not_found" ? 404 :
      err.code === "forbidden" ? 403 :
      err.code === "validation" || err.code === "invalid_state" ? 400 :
      err.code === "conflict" ? 409 : 500;
    return NextResponse.json({ error: err.message, code: err.code }, { status });
  }
  // eslint-disable-next-line no-console
  console.error(tag, err);
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}
