import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireRole } from "@/lib/auth/require-role";
import { getAdminToken, invalidateAdminToken } from "@/lib/api/admin-token";

/**
 * Proxy → backend GET /api/superadmin/mentors. Returns REAL mentor accounts
 * (login_accounts where role LIKE 'mentor%') so the Commercial-gate assign-mentor
 * dropdown and the admin Mentors registry show provisioned mentors, not mocks.
 */

const GLIMMORA_API = process.env.GLIMMORA_API_URL || process.env.NEXT_PUBLIC_GLIMMORA_API_URL;
const ADMIN_EMAIL = process.env.GLIMMORA_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.GLIMMORA_ADMIN_PASSWORD;


export async function GET(req: NextRequest) {
  const guard = await requireRole(["super_admin"]);
  if (guard instanceof NextResponse) return guard;

  const secureCookie = req.nextUrl.protocol === "https:";
  const jwt = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie });
  let token = (jwt as { glimmoraAccessToken?: string } | null)?.glimmoraAccessToken;
  if (!token) token = (await getAdminToken()) ?? undefined;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const upstream = `${GLIMMORA_API}/api/superadmin/mentors`;
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
      { error: (data as { detail?: string }).detail ?? "Failed to load mentors" },
      { status: res.status },
    );
  }

  return NextResponse.json(data, { status: 200 });
}
