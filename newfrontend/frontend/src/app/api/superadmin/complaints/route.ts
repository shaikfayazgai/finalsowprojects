/**
 * GET /api/superadmin/complaints — all tenant complaints (platform admin).
 * Optional ?status=open|in_progress|resolved filter is forwarded.
 * Proxies to the super-admin FastAPI backend (:8102) with the admin Bearer token.
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

function isAdmin(role: string | undefined): boolean {
  return role === "admin" || role === "super_admin" || role === "superadmin";
}

export async function GET(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.role as string | undefined)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = new URL(req.url).searchParams.get("status");
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  try {
    const res = await fetch(`${backendBase()}/api/superadmin/complaints${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "BACKEND_UNAVAILABLE" }, { status: 503 });
  }
}
