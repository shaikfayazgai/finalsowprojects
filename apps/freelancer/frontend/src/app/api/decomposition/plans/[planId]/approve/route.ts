/**
 * POST /api/decomposition/plans/:planId/approve
 *
 * Sponsor sign-off. Status draft → approved. Plan is then frozen
 * (only activatePlan / archivePlan can change it from approved).
 *
 * Permission: approve.decomposition_plan
 */

import { NextRequest, NextResponse } from "next/server";
import { requireTenantRequest } from "@/lib/api/request-context";
import { userHasPermission } from "@/lib/auth/permissions";
import { approvePlan, DecompositionServiceError } from "@/lib/decomposition";

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

  if (!(await userHasPermission(ctx.userId, "approve.decomposition_plan"))) {
    return NextResponse.json(
      { error: "forbidden", reason: "missing_permission:approve.decomposition_plan" },
      { status: 403 },
    );
  }

  try {
    const plan = await ctx.withTx(async (tx) => {
      const result = await approvePlan(tx, { planId, approverId: ctx.userId });
      await ctx.audit(
        {
          action: "decomposition.plan.approve",
          resource: {
            type: "decomposition_plan",
            id: planId,
            label: `Plan v${result.version}`,
          },
          payload: {
            sowId: result.sowId,
            taskCount: result.tasks.length,
          },
          severity: "info",
        },
        { tx },
      );
      return result;
    });
    return NextResponse.json({ plan }, { status: 200 });
  } catch (err) {
    return mapErr(err, "[decomp.plan.approve]");
  }
}

function mapErr(err: unknown, tag: string): NextResponse {
  if (err instanceof DecompositionServiceError) {
    const status =
      err.code === "not_found" ? 404 :
      err.code === "forbidden" ? 403 :
      err.code === "validation" || err.code === "invalid_state" ? 400 : 500;
    return NextResponse.json({ error: err.message, code: err.code }, { status });
  }
  // eslint-disable-next-line no-console
  console.error(tag, err);
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}
