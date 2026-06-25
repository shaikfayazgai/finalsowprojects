/**
 * DELETE /api/superadmin/contributors/[id] — soft-delete (tombstone) a
 * contributor.
 *
 * Proxies to the super-admin FastAPI backend's
 * DELETE /api/superadmin/contributors/{account_id}, injecting the admin's
 * backend JWT as a Bearer token. The backend enforces the admin role AND only
 * tombstones the login_accounts row (additive-only — never a physical DELETE).
 *
 * Mirrors the mentor delete proxy (.../mentors/[mentorId]) for token handling.
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

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const token = await bearer();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const res = await fetch(
      `${backendBase()}/api/superadmin/contributors/${encodeURIComponent(id)}`,
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
