import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { getAdminToken, invalidateAdminToken } from "@/lib/api/admin-token";

/** Proxy → backend GET /api/superadmin/all-users (real provisioned accounts +
 * status) so the enterprise member registry shows real users, not just mocks. */

const GLIMMORA_API = process.env.GLIMMORA_API_URL || process.env.NEXT_PUBLIC_GLIMMORA_API_URL;
const ADMIN_EMAIL = process.env.GLIMMORA_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.GLIMMORA_ADMIN_PASSWORD;


export async function GET(_req: NextRequest) {
  const guard = await requireRole(["super_admin", "enterprise"]);
  if (guard instanceof NextResponse) return guard;

  // This is a superadmin-scoped endpoint. Enterprise admins are allowed to view
  // it, but their own session token isn't admin-scoped (backend would 403), so
  // always use the admin service token here.
  const token = (await getAdminToken()) ?? undefined;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Tenant scoping: enterprise admins see ONLY their own tenant's members. We
  // pass the caller's email and the backend resolves their tenant_id (so it
  // can't be spoofed). Super admins pass nothing → they see every account.
  const isSuperAdmin = guard.role === "super_admin";
  const qs =
    !isSuperAdmin && guard.email
      ? `?caller_email=${encodeURIComponent(guard.email)}`
      : "";
  const upstream = `${GLIMMORA_API}/api/superadmin/all-users${qs}`;
  const send = (bearer: string) => fetch(upstream, { headers: { Authorization: `Bearer ${bearer}` } });

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
      { error: (data as { detail?: string }).detail ?? "Failed to load users" },
      { status: res.status },
    );
  }
  return NextResponse.json(data, { status: 200 });
}
