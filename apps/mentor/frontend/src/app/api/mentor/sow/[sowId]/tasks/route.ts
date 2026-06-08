import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireRole } from "@/lib/auth/require-role";
import { backendBaseForPath } from "@/lib/api/backend-router";
import { getAdminToken, invalidateAdminToken } from "@/lib/api/admin-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Proxy → backend GET /api/mentor/sow/{sow_id}/tasks. Decomposed tasks + their
 * statuses for a SOW assigned to this mentor (no payout fields). Uses the
 * mentor's session token.
 */

const GLIMMORA_API = backendBaseForPath("/api/v1/auth/login");
const ADMIN_EMAIL = process.env.GLIMMORA_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.GLIMMORA_ADMIN_PASSWORD;


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sowId: string }> },
) {
  const guard = await requireRole(["mentor", "super_admin", "admin"]);
  if (guard instanceof NextResponse) return guard;

  const { sowId } = await params;
  const secureCookie = req.nextUrl.protocol === "https:";
  const jwt = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie });
  let token = (jwt as { glimmoraAccessToken?: string } | null)?.glimmoraAccessToken;
  if (!token) token = (await getAdminToken()) ?? undefined;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await fetch(
    `${GLIMMORA_API}/api/mentor/sow/${encodeURIComponent(sowId)}/tasks`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = await res.json().catch(() => ({} as Record<string, unknown>));
  if (!res.ok) {
    return NextResponse.json(
      { error: (data as { detail?: string }).detail ?? "Failed to load SOW tasks" },
      { status: res.status },
    );
  }
  return NextResponse.json(data, { status: 200 });
}
