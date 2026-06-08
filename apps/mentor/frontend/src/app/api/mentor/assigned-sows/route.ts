import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireRole } from "@/lib/auth/require-role";
import { backendBaseForPath } from "@/lib/api/backend-router";
import { getAdminToken, invalidateAdminToken } from "@/lib/api/admin-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Proxy → backend GET /api/mentor/assigned-sows. SOWs assigned to the signed-in
 * mentor at the Commercial gate (admin_records kind=sow_mentor joined to
 * enterprise_sows), shown immediately. Uses the mentor's session token so the
 * backend scopes to exactly this mentor by account id.
 */

const GLIMMORA_API = backendBaseForPath("/api/mentor/assigned-sows");
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

  const res = await fetch(`${GLIMMORA_API}/api/mentor/assigned-sows`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({} as Record<string, unknown>));
  if (!res.ok) {
    return NextResponse.json(
      { error: (data as { detail?: string }).detail ?? "Failed to load assigned SOWs" },
      { status: res.status },
    );
  }
  return NextResponse.json(data, { status: 200 });
}
