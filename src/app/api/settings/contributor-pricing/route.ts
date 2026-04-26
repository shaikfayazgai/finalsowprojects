import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const GLIMMORA_API =
  process.env.GLIMMORA_API_URL ?? process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? "";

const ADMIN_EMAIL = process.env.GLIMMORA_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.GLIMMORA_ADMIN_PASSWORD;

let cachedAdminToken: { token: string; expiresAt: number } | null = null;

async function getAdminToken(): Promise<string | null> {
  if (cachedAdminToken && Date.now() / 1000 < cachedAdminToken.expiresAt - 60) {
    return cachedAdminToken.token;
  }
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return null;
  // Skip the dev-only bypass account — it doesn't exist in the real backend
  if (ADMIN_EMAIL === "admin@glimmora.dev") return null;

  try {
    const res = await fetch(`${GLIMMORA_API}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = await res.json().catch(() => ({}));
    if (data.access_token) {
      cachedAdminToken = {
        token: data.access_token,
        expiresAt: Math.floor(Date.now() / 1000) + (Number(data.expires_in) || 3600),
      };
      return cachedAdminToken.token;
    }
  } catch {
    // Network error or timeout — fall through
  }
  return null;
}

/** Resolve a valid bearer token from the incoming NextAuth session. */
async function resolveToken(req: NextRequest): Promise<string | null> {
  const secureCookie = req.nextUrl.protocol === "https:";
  const jwt = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie });
  if (!jwt?.email) return null;

  // Prefer the logged-in user's own Glimmora token
  const userToken = jwt.glimmoraAccessToken as string | undefined;
  if (userToken) return userToken;

  // Fall back to the service-account credentials from .env
  return (await getAdminToken()) ?? null;
}

// ── GET /api/settings/contributor-pricing ────────────────────────────────────
// Proxies GET /api/v1/settings/contributor-pricing (enterprise_admin required)

export async function GET(req: NextRequest) {
  const token = await resolveToken(req);

  if (!token) {
    return NextResponse.json(
      {
        error:
          "No admin token available. " +
          "Ensure you are logged in with a real enterprise_admin account " +
          "or set valid GLIMMORA_ADMIN_EMAIL / GLIMMORA_ADMIN_PASSWORD in .env.",
      },
      { status: 503 },
    );
  }

  try {
    const backendRes = await fetch(
      `${GLIMMORA_API}/api/v1/settings/contributor-pricing`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(30_000),
        cache: "no-store",
      },
    );

    // If token was rejected, retry once with a fresh admin token
    if (backendRes.status === 401 && ADMIN_EMAIL && ADMIN_PASSWORD) {
      cachedAdminToken = null;
      const freshToken = await getAdminToken();
      if (freshToken) {
        const retry = await fetch(
          `${GLIMMORA_API}/api/v1/settings/contributor-pricing`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${freshToken}`,
            },
            signal: AbortSignal.timeout(30_000),
            cache: "no-store",
          },
        );
        const retryData = await retry.json().catch(() => ({}));
        return NextResponse.json(retryData, { status: retry.status });
      }
    }

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch pricing config" },
      { status: 502 },
    );
  }
}

// ── PUT /api/settings/contributor-pricing ────────────────────────────────────
// Proxies PUT /api/v1/settings/contributor-pricing (enterprise_admin + super_admin)

export async function PUT(req: NextRequest) {
  const token = await resolveToken(req);

  if (!token) {
    return NextResponse.json(
      {
        error:
          "No super-admin token available. " +
          "Ensure you are logged in with a real enterprise_admin account " +
          "or set valid GLIMMORA_ADMIN_EMAIL / GLIMMORA_ADMIN_PASSWORD in .env.",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const backendRes = await callPutBackend(token, body);

  // If token was rejected, retry once with a fresh admin token
  if (backendRes.status === 401 && ADMIN_EMAIL && ADMIN_PASSWORD) {
    cachedAdminToken = null;
    const freshToken = await getAdminToken();
    if (freshToken) {
      const retry = await callPutBackend(freshToken, body);
      const retryData = await retry.json().catch(() => ({}));
      return NextResponse.json(retryData, { status: retry.status });
    }
  }

  const data = await backendRes.json().catch(() => ({}));
  return NextResponse.json(data, { status: backendRes.status });
}

async function callPutBackend(token: string, body: unknown): Promise<Response> {
  return fetch(`${GLIMMORA_API}/api/v1/settings/contributor-pricing`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
}
