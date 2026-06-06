import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.GLIMMORA_API_URL ?? process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? "";
const ADMIN_EMAIL = process.env.GLIMMORA_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.GLIMMORA_ADMIN_PASSWORD;

let cachedAdminToken: { token: string; expiresAt: number } | null = null;
async function getAdminToken(): Promise<string | null> {
  if (cachedAdminToken && Date.now() / 1000 < cachedAdminToken.expiresAt - 60) return cachedAdminToken.token;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return null;
  try {
    const res = await fetch(`${BACKEND}/api/v1/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    const data = await res.json().catch(() => ({}));
    if (typeof data.access_token === "string") {
      cachedAdminToken = { token: data.access_token, expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in || 3600) };
      return cachedAdminToken.token;
    }
  } catch { /* ignore */ }
  return null;
}

async function authHeader(req: NextRequest): Promise<Record<string, string>> {
  let auth = req.headers.get("authorization");
  if (!auth) { const t = await getAdminToken(); if (t) auth = `Bearer ${t}`; }
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) h.Authorization = auth;
  return h;
}

// Assign a mentor to a SOW (Super Admin, at the Commercial gate).
export async function POST(req: NextRequest, { params }: { params: Promise<{ sowId: string }> }) {
  const { sowId } = await params;
  const body = await req.text();
  try {
    const r = await fetch(`${BACKEND}/api/superadmin/sows/${sowId}/assign-mentor`, {
      method: "POST", headers: await authHeader(req), body, signal: AbortSignal.timeout(30000),
    });
    return NextResponse.json(await r.json().catch(() => ({})), { status: r.status });
  } catch {
    return NextResponse.json({ detail: "Assign failed" }, { status: 500 });
  }
}
