import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.GLIMMORA_API_URL ?? process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? "";
const ADMIN_EMAIL = process.env.GLIMMORA_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.GLIMMORA_ADMIN_PASSWORD;

let cachedAdminToken: { token: string; expiresAt: number } | null = null;

// Mint a Super Admin token from env when the request has no Authorization
// header (browser fetch from the SOW list doesn't carry the session token).
async function getAdminToken(): Promise<string | null> {
  if (cachedAdminToken && Date.now() / 1000 < cachedAdminToken.expiresAt - 60) {
    return cachedAdminToken.token;
  }
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return null;
  try {
    const res = await fetch(`${BACKEND}/api/v1/auth/login`, {
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

// Platform-wide SOW list for the Super Admin (all tenants).
export async function GET(req: NextRequest) {
  const qs = req.nextUrl.search;
  let auth = req.headers.get("authorization");
  if (!auth) {
    const t = await getAdminToken();
    if (t) auth = `Bearer ${t}`;
  }
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) headers.Authorization = auth;
  try {
    const r = await fetch(`${BACKEND}/api/superadmin/sows${qs}`, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });
    return NextResponse.json(await r.json().catch(() => ({})), { status: r.status });
  } catch {
    return NextResponse.json({ items: [], total: 0 }, { status: 200 });
  }
}
