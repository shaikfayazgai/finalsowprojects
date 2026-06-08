import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { getAdminToken, invalidateAdminToken } from "@/lib/api/admin-token";

/**
 * Proxy → backend GET /api/superadmin/reviewers. Real reviewer accounts
 * (login_accounts role LIKE 'reviewer%') so the SOW intake reviewer picker can
 * select REAL people instead of mock candidates.
 */

const GLIMMORA_API = process.env.GLIMMORA_API_URL || process.env.NEXT_PUBLIC_GLIMMORA_API_URL;
const ADMIN_EMAIL = process.env.GLIMMORA_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.GLIMMORA_ADMIN_PASSWORD;


export async function GET(_req: NextRequest) {
  // Enterprise admins (who assign reviewers at SOW intake) and super admins may
  // list reviewers. This is a superadmin-scoped backend endpoint, so always use
  // the admin service token (the enterprise session token isn't admin-scoped).
  const guard = await requireRole(["super_admin", "enterprise"]);
  if (guard instanceof NextResponse) return guard;

  const token = (await getAdminToken()) ?? undefined;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const upstream = `${GLIMMORA_API}/api/superadmin/reviewers`;
  const send = (bearer: string) =>
    fetch(upstream, { headers: { Authorization: `Bearer ${bearer}` } });

  let res = await send(token);
  let data = await res.json().catch(() => ({} as Record<string, unknown>));

  if ((res.status === 401 || res.status === 403) && ADMIN_EMAIL && ADMIN_PASSWORD) {
    invalidateAdminToken();
    const fresh = await getAdminToken();
    if (fresh) {
      res = await send(fresh);
      data = await res.json().catch(() => ({} as Record<string, unknown>));
    }
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: (data as { detail?: string }).detail ?? "Failed to load reviewers" },
      { status: res.status },
    );
  }
  return NextResponse.json(data, { status: 200 });
}
