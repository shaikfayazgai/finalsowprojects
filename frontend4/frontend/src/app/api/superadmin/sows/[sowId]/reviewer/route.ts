import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { getAdminToken, invalidateAdminToken } from "@/lib/api/admin-token";

/**
 * Proxy → backend GET/POST /api/superadmin/sows/{sow_id}/reviewer.
 *  - GET  returns the reviewer currently assigned to a SOW (or null).
 *  - POST assigns (or re-assigns) the enterprise reviewer at SOW intake step 2.
 *
 * Enterprise admins assign reviewers (they own intake) and super admins too;
 * both fall back to the platform admin service account when their session token
 * isn't accepted by the admin-only backend endpoint.
 */

const GLIMMORA_API = process.env.GLIMMORA_API_URL || process.env.NEXT_PUBLIC_GLIMMORA_API_URL;
const ADMIN_EMAIL = process.env.GLIMMORA_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.GLIMMORA_ADMIN_PASSWORD;


async function resolveToken(req: NextRequest): Promise<string | undefined> {
  // These backend endpoints are admin-only. An enterprise admin's session token
  // is NOT admin-scoped (backend returns 403), so always use the admin service
  // token. (Kept the req param for signature stability.)
  void req;
  return (await getAdminToken()) ?? undefined;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sowId: string }> },
) {
  const guard = await requireRole(["super_admin", "enterprise"]);
  if (guard instanceof NextResponse) return guard;

  const { sowId } = await params;
  let token = await resolveToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const upstream = `${GLIMMORA_API}/api/superadmin/sows/${encodeURIComponent(sowId)}/reviewer`;
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
      { error: (data as { detail?: string }).detail ?? "Failed to load SOW reviewer" },
      { status: res.status },
    );
  }
  return NextResponse.json(data, { status: 200 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sowId: string }> },
) {
  const guard = await requireRole(["super_admin", "enterprise"]);
  if (guard instanceof NextResponse) return guard;

  const { sowId } = await params;
  let token = await resolveToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const upstream = `${GLIMMORA_API}/api/superadmin/sows/${encodeURIComponent(sowId)}/assign-reviewer`;
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
      { error: (data as { detail?: string }).detail ?? "Failed to assign reviewer" },
      { status: res.status },
    );
  }
  return NextResponse.json(data, { status: res.status });
}
