import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

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
  // Verify caller is authenticated via NextAuth
  const secureCookie = req.nextUrl.protocol === "https:";
  const jwt = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie });
  if (!jwt?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Prefer the user's own Glimmora token (real enterprise admin login)
  let token = jwt.glimmoraAccessToken as string | undefined;

  // Fall back to dedicated admin credentials from env vars
  if (!token) {
    token = (await getAdminToken()) ?? undefined;
  }

  if (!token) {
    return NextResponse.json(
      { error: "No admin token available. Set GLIMMORA_ADMIN_EMAIL and GLIMMORA_ADMIN_PASSWORD in .env." },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
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
