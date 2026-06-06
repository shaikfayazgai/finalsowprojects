import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireRole } from "@/lib/auth/require-role";

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
    if (data.access_token) {
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

export async function POST(req: NextRequest) {
  // Authorization — minting reviewer accounts is enterprise + admin only.
  const guard = await requireRole(["enterprise", "admin", "super_admin"]);
  if (guard instanceof NextResponse) return guard;

  // Existing JWT load kept so downstream `glimmoraAccessToken` access still works.
  const secureCookie = req.nextUrl.protocol === "https:";
  const jwt = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const headerAuth = req.headers.get("authorization") || "";
  const headerToken = headerAuth.toLowerCase().startsWith("bearer ")
    ? headerAuth.slice(7).trim()
    : undefined;

  const bodyToken = typeof body.accessToken === "string" ? body.accessToken : undefined;
  if ("accessToken" in body) delete body.accessToken;

  // Prefer explicit caller token, then user's session token.
  let token = bodyToken || headerToken || (jwt?.glimmoraAccessToken as string | undefined);

  // Fall back to dedicated admin credentials from env vars
  if (!token) {
    token = (await getAdminToken()) ?? undefined;
  }

  if (!token) {
    return NextResponse.json(
      { error: "No admin token available. Please sign in again as enterprise admin." },
      { status: 503 },
    );
  }

  const res = await fetch(`${GLIMMORA_API}/api/v1/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  // If token was rejected, retry once with fresh admin token
  if (res.status === 401 && ADMIN_EMAIL && ADMIN_PASSWORD) {
    cachedAdminToken = null;
    const freshToken = await getAdminToken();
    if (freshToken) {
      const retry = await fetch(`${GLIMMORA_API}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${freshToken}`,
        },
        body: JSON.stringify(body),
      });
      const retryData = await retry.json().catch(() => ({}));
      return NextResponse.json(retryData, { status: retry.status });
    }
  }

  return NextResponse.json(data, { status: res.status });
}
