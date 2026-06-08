import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { backendBaseForPath } from "@/lib/api/backend-router";
import { getAdminToken, invalidateAdminToken } from "@/lib/api/admin-token";

/**
 * Proxy → backend GET/POST /api/superadmin/sows/{sow_id}/mentor.
 *  - GET  returns the mentor currently assigned to a SOW (or null).
 *  - POST assigns (or re-assigns) the Glimmora QA mentor at the Commercial gate.
 *
 * Admin-only backend endpoint, so ALWAYS use the admin service token (an admin
 * session token may not be admin-scoped at the backend); retry on 401/403.
 */

const GLIMMORA_API = backendBaseForPath("/api/v1/auth/login");
const ADMIN_EMAIL = process.env.GLIMMORA_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.GLIMMORA_ADMIN_PASSWORD;


export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sowId: string }> },
) {
  const guard = await requireRole(["super_admin", "admin"]);
  if (guard instanceof NextResponse) return guard;

  const { sowId } = await params;
  const token = (await getAdminToken()) ?? undefined;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const upstream = `${GLIMMORA_API}/api/superadmin/sows/${encodeURIComponent(sowId)}/mentor`;
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
      { error: (data as { detail?: string }).detail ?? "Failed to load SOW mentor" },
      { status: res.status },
    );
  }
  return NextResponse.json(data, { status: 200 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sowId: string }> },
) {
  const guard = await requireRole(["super_admin", "admin"]);
  if (guard instanceof NextResponse) return guard;

  const { sowId } = await params;
  const token = (await getAdminToken()) ?? undefined;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const upstream = `${GLIMMORA_API}/api/superadmin/sows/${encodeURIComponent(sowId)}/assign-mentor`;
  const send = (bearer: string) =>
    fetch(upstream, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${bearer}` },
      body: JSON.stringify(body),
    });

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
      { error: (data as { detail?: string }).detail ?? "Failed to assign mentor" },
      { status: res.status },
    );
  }
  return NextResponse.json(data, { status: res.status });
}
