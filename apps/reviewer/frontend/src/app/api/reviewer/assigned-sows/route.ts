import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireRole } from "@/lib/auth/require-role";
import { backendBaseForPath } from "@/lib/api/backend-router";
import { getAdminToken, invalidateAdminToken } from "@/lib/api/admin-token";

/**
 * Proxy → backend GET /api/v1/reviewer/assigned-sows. Returns the SOWs this
 * reviewer was assigned to at intake (admin_records kind=sow_reviewer), shown in
 * the reviewer portal immediately — before any delivery — so the reviewer can
 * see what they're responsible for.
 *
 * Uses the reviewer's own session token (endpoint is reviewer-scoped via
 * get_current_user); falls back to the platform admin account if missing.
 */

const GLIMMORA_API = backendBaseForPath("/api/v1/reviewer/assigned-sows");
const ADMIN_EMAIL = process.env.GLIMMORA_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.GLIMMORA_ADMIN_PASSWORD;


export async function GET(req: NextRequest) {
  const guard = await requireRole(["reviewer", "enterprise", "super_admin", "admin"]);
  if (guard instanceof NextResponse) return guard;

  const secureCookie = req.nextUrl.protocol === "https:";
  const jwt = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie });
  let token = (jwt as { glimmoraAccessToken?: string } | null)?.glimmoraAccessToken;
  if (!token) token = (await getAdminToken()) ?? undefined;

  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const upstream = `${GLIMMORA_API}/api/v1/reviewer/assigned-sows`;
  const send = (bearer: string) =>
    fetch(upstream, { headers: { Authorization: `Bearer ${bearer}` } });

  let res = await send(token);
  let data = await res.json().catch(() => ({} as Record<string, unknown>));

  if (res.status === 401 && ADMIN_EMAIL && ADMIN_PASSWORD) {
    invalidateAdminToken();
    const fresh = await getAdminToken();
    if (fresh) {
      res = await send(fresh);
      data = await res.json().catch(() => ({} as Record<string, unknown>));
    }
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: (data as { detail?: string }).detail ?? "Failed to load assigned SOWs" },
      { status: res.status },
    );
  }
  return NextResponse.json(data, { status: 200 });
}
