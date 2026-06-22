import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  demoSubscriptionSnapshot,
  resolveSubscriptionForUserId,
} from "@/lib/subscription/resolve";

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

  try {
    const sub = await resolveSubscriptionForUserId(session.user.id);
    if (sub) {
      return NextResponse.json(sub);
    }
  } catch {
    // DB unavailable — fall through to demo snapshot for enterprise demo mode
  }

  // Only serve the fabricated demo snapshot when demo mode is explicitly on.
  if (process.env.NEXT_PUBLIC_ENTERPRISE_DEMO === "1") {
    return NextResponse.json(demoSubscriptionSnapshot("m19-tenant-a"));
  }

  // No subscription on record (e.g. backend-only tenants not mirrored in Prisma):
  // return 200 with a null body so the dashboard simply hides the usage strip,
  // instead of a 404 that shows as an error on every page load.
  return NextResponse.json(null, { status: 200 });
}
