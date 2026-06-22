/**
 * POST /api/superadmin/mentors/[mentorId]/resend
 * Re-invite a mentor — regenerate a temp password + re-email credentials.
 * Proxies to the super-admin FastAPI backend (:8102) with the admin bearer.
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

export async function POST(_req: NextRequest, ctx: { params: Promise<{ mentorId: string }> }) {
  const token = await bearer();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { mentorId } = await ctx.params;
  try {
    const res = await fetch(
      `${backendBase()}/api/superadmin/mentors/${encodeURIComponent(mentorId)}/resend`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      },
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "BACKEND_UNAVAILABLE" }, { status: 503 });
  }
}
