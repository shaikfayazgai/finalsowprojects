/**
 * GET /api/superadmin/mentors/[mentorId]/competency  — current competency rows
 * PUT /api/superadmin/mentors/[mentorId]/competency  — replace the competency matrix
 *
 * Proxies to the super-admin FastAPI backend (:8102) with the admin bearer.
 * (GET reuses the mentor-detail endpoint and returns just the competency array.)
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

export async function GET(_req: NextRequest, ctx: { params: Promise<{ mentorId: string }> }) {
  const token = await bearer();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { mentorId } = await ctx.params;
  try {
    const res = await fetch(`${backendBase()}/api/superadmin/mentors/${encodeURIComponent(mentorId)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    const data = (await res.json().catch(() => ({}))) as { competency?: unknown };
    return NextResponse.json({ competency: data.competency ?? [] }, { status: res.status });
  } catch {
    return NextResponse.json({ error: "BACKEND_UNAVAILABLE" }, { status: 503 });
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ mentorId: string }> }) {
  const token = await bearer();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { mentorId } = await ctx.params;
  const body = await req.text();
  try {
    const res = await fetch(
      `${backendBase()}/api/superadmin/mentors/${encodeURIComponent(mentorId)}/competency`,
      {
        method: "PUT",
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
