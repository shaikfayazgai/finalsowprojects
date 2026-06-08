import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";

/**
 * Proxy → backend GET/POST /api/superadmin/sows/{sow_id}/mentor.
 *  - GET  returns the mentor currently assigned to a SOW (or null).
 *  - POST assigns (or re-assigns) the Glimmora QA mentor at the Commercial gate.
 *
 * Admin-only backend endpoint, so ALWAYS use the admin service token (an admin
 * session token may not be admin-scoped at the backend); retry on 401/403.
 */

const GLIMMORA_API = process.env.GLIMMORA_API_URL || process.env.NEXT_PUBLIC_GLIMMORA_API_URL;
const ADMIN_EMAIL = process.env.GLIMMORA_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.GLIMMORA_ADMIN_PASSWORD;

let cachedAdminToken: { token: string; expiresAt: number } | null = null;

async function getAdminToken(): Promise<string | null> {
  if (cachedAdminToken && Date.now() / 1000 < cachedAdminToken.expiresAt - 60) {
    return cachedAdminToken.token;
  }
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return null;
  try {
    const res = await fetch(`${GLIMMORA_API}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    const data = await res.json().catch(() => ({}));
    if (typeof data.access_token === "string") {
      cachedAdminToken = {
        token: data.access_token,
        expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
      };
      return cachedAdminToken.token;
    }
  } catch {
    // ignore
  }
  return null;
}

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
    cachedAdminToken = null;
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
    cachedAdminToken = null;
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
