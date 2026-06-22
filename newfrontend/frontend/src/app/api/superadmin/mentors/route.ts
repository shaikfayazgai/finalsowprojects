/**
 * GET  /api/superadmin/mentors   — list mentors (MockAdminMentor[] in `items`/`mentors`)
 * POST /api/superadmin/mentors   — invite/create a mentor (temp pw + email + forced reset)
 *
 * Proxies to the super-admin FastAPI backend (:8102), injecting the admin's
 * backend JWT as a Bearer token. Backend enforces the admin role + email uniqueness.
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

async function bearer(): Promise<string | null> {
  const session = await auth();
  const role = session?.user?.role as string | undefined;
  if (role !== "admin" && role !== "super_admin" && role !== "superadmin") return null;
  return (session?.user as { accessToken?: string } | undefined)?.accessToken ?? null;
}

export async function GET(req: NextRequest) {
  const token = await bearer();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const qs = req.nextUrl.search ?? "";
  try {
    const res = await fetch(`${backendBase()}/api/superadmin/mentors${qs}`, {
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

export async function POST(req: NextRequest) {
  const token = await bearer();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.text();
  try {
    const res = await fetch(`${backendBase()}/api/superadmin/mentors`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "BACKEND_UNAVAILABLE" }, { status: 503 });
  }
}
