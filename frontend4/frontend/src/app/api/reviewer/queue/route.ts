import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireRole } from "@/lib/auth/require-role";
import { getAdminToken, invalidateAdminToken } from "@/lib/api/admin-token";

/**
 * Proxy → backend GET /api/v1/reviewer/dashboard. Returns the signed-in
 * reviewer's REAL assignments (reviewer_assignments — submissions a mentor has
 * accepted that now await second-stage QA), so the reviewer queue shows actual
 * routed work instead of the mock roster.
 *
 * The reviewer uses their own session token (the backend endpoint is reviewer-
 * scoped via get_current_user); we fall back to the platform admin account only
 * if the session token is missing.
 */

const GLIMMORA_API = process.env.GLIMMORA_API_URL || process.env.NEXT_PUBLIC_GLIMMORA_API_URL;
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

  const upstream = `${GLIMMORA_API}/api/v1/reviewer/dashboard`;
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
      { error: (data as { detail?: string }).detail ?? "Failed to load reviewer queue" },
      { status: res.status },
    );
  }
  return NextResponse.json(data, { status: 200 });
}
