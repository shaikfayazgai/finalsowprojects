/**
 * GET /api/superadmin/tenants/[tenantId] — single tenant detail (MockTenant shape).
 * Proxies to the super-admin FastAPI backend (:8102) with the admin's Bearer token.
 */

import { NextResponse } from "next/server";
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
  _req: Request,
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
  try {
    const res = await fetch(
      `${backendBase()}/api/superadmin/tenants/${encodeURIComponent(tenantId)}`,
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

/** PATCH — update tenant status (active/suspended) and/or tier. Persisted. */
export async function PATCH(
  req: Request,
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
  const body = await req.text();
  try {
    const res = await fetch(
      `${backendBase()}/api/superadmin/tenants/${encodeURIComponent(tenantId)}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body,
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

/** DELETE — soft-delete the tenant (backend sets deletedAt; data is retained). */
export async function DELETE(
  _req: Request,
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
  try {
    const res = await fetch(
      `${backendBase()}/api/superadmin/tenants/${encodeURIComponent(tenantId)}`,
      {
        method: "DELETE",
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
