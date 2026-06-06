import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { listSubscriptionPlanHistory } from "@/lib/subscription/plan-history";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ tenantId: string }> },
) {
  const guard = await requireRole(["admin", "super_admin"]);
  if (guard instanceof Response) return guard;

  const { tenantId } = await ctx.params;
  const items = await listSubscriptionPlanHistory(tenantId);
  return NextResponse.json({ tenantId, items });
}
