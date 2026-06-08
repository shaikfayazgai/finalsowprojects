import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireRole } from "@/lib/auth/require-role";
import { getAdminToken, invalidateAdminToken } from "@/lib/api/admin-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Proxy → backend GET /api/mentor/queue. Real per-mentor review queue (own
 * assigned reviews + unclaimed 'pool' submissions), scoped via the mentor's
 * session token. No mock data.
 */

const GLIMMORA_API = process.env.GLIMMORA_API_URL || process.env.NEXT_PUBLIC_GLIMMORA_API_URL;
const ADMIN_EMAIL = process.env.GLIMMORA_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.GLIMMORA_ADMIN_PASSWORD;


export async function GET(req: NextRequest) {
  const guard = await requireRole(["mentor", "super_admin", "admin"]);
  if (guard instanceof NextResponse) return guard;

  const secureCookie = req.nextUrl.protocol === "https:";
  const jwt = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie });
  let token = (jwt as { glimmoraAccessToken?: string } | null)?.glimmoraAccessToken;
  if (!token) token = (await getAdminToken()) ?? undefined;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const qs = req.nextUrl.searchParams.toString();
  const upstream = `${GLIMMORA_API}/api/mentor/queue${qs ? `?${qs}` : ""}`;
  const res = await fetch(upstream, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json().catch(() => ({} as Record<string, unknown>));
  if (!res.ok) {
    return NextResponse.json(
      { error: (data as { detail?: string }).detail ?? "Failed to load mentor queue" },
      { status: res.status },
    );
  }
  return NextResponse.json(data, { status: 200 });
}
