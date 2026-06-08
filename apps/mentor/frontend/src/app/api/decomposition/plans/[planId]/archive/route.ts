/**
 * POST /api/decomposition/plans/:planId/archive
 *
 * Terminal archive. Allowed from any non-archived state.
 *
 * Permission: archive.decomposition_plan
 */

import { NextRequest, NextResponse } from "next/server";
import { requireTenantRequest } from "@/lib/api/request-context";
import { userHasPermission } from "@/lib/auth/permissions";
import { archivePlan, DecompositionServiceError } from "@/lib/decomposition";

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

  if (!(await userHasPermission(ctx.userId, "archive.decomposition_plan"))) {
    return NextResponse.json(
      { error: "forbidden", reason: "missing_permission:archive.decomposition_plan" },
      { status: 403 },
    );
  }

  try {
    const plan = await ctx.withTx(async (tx) => {
      const result = await archivePlan(tx, { planId });
      await ctx.audit(
        {
          action: "decomposition.plan.archive",
          resource: {
            type: "decomposition_plan",
            id: planId,
            label: `Plan v${result.version}`,
          },
          payload: { sowId: result.sowId },
          severity: "info",
        },
        { tx },
      );
      return result;
    });
    return NextResponse.json({ plan }, { status: 200 });
  } catch (err) {
    return mapErr(err, "[decomp.plan.archive]");
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
