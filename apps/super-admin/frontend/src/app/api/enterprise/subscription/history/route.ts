import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { resolveSubscriptionForUserId } from "@/lib/subscription/resolve";
import { listSubscriptionPlanHistory } from "@/lib/subscription/plan-history";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== "enterprise" && role !== "admin" && role !== "super_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const sub = await resolveSubscriptionForUserId(session.user.id);
  const tenantId = sub?.tenantId ?? "m19-tenant-a";

  const items = await listSubscriptionPlanHistory(tenantId);
  return NextResponse.json({ tenantId, items });
}
