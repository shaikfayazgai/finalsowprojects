/**
 * GET /api/superadmin/tenants/[tenantId]/provisioning-status
 * Live provisioning step states for a tenant (derived from real data: admin
 * account, first sign-in + password reset, employees, SOWs). Proxies to the
 * super-admin FastAPI backend with the admin bearer. Forwards ?admin_email=
 * as a fallback when the UI tenant id doesn't match the account's tenant_id.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function backendBase(): string {
  return (
    process.env.BACKEND_SERVICE_URL ??
    process.env.GLIMMORA_API_BASE_URL ??
    process.env.NEXT_PUBLIC_GLIMMORA_API_URL ??
    "http://127.0.0.1:8102"
  );
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ tenantId: string }> },
) {
  const session = await auth();
  const role = session?.user?.role as string | undefined;
  if (role !== "admin" && role !== "super_admin" && role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tenantId } = await ctx.params;
  const adminEmail = req.nextUrl.searchParams.get("admin_email") ?? "";
  const qs = adminEmail ? `?admin_email=${encodeURIComponent(adminEmail)}` : "";
  try {
    const res = await fetch(
      `${backendBase()}/api/superadmin/tenants/${encodeURIComponent(tenantId)}/provisioning-status${qs}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
      },
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "BACKEND_UNAVAILABLE" }, { status: 503 });
  }
}
