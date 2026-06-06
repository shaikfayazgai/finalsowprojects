import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Proxy for Glimmora SOW API calls.
 *
 * The Glimmora API requires a Bearer token, but enterprise users get
 * `mfa_setup_required` on login which blocks token issuance.
 *
 * This proxy:
 * 1. Authenticates the user via their NextAuth session (JWT).
 * 2. Acquires a Glimmora API token server-side (cached per-request).
 * 3. Forwards the request to the Glimmora API with the Bearer token.
 *
 * Frontend calls: POST /api/sow/proxy
 *   body: { path: "/api/v1/wizards", method: "POST", payload: {...} }
 */

const GLIMMORA_API = process.env.GLIMMORA_API_URL || process.env.NEXT_PUBLIC_GLIMMORA_API_URL;

// ── In-memory token cache (per server instance) ──────────────────────────
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getGlimmoraToken(): Promise<string | null> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() / 1000 < cachedToken.expiresAt - 60) {
    return cachedToken.token;
  }

  // Use a service account or the contributor test user to get a token
  // In production, use a dedicated service account
  const email = process.env.GLIMMORA_SERVICE_EMAIL || "sow-test-user@glimmora.com";
  const password = process.env.GLIMMORA_SERVICE_PASSWORD || "Test@12345";

  try {
    const res = await fetch(`${GLIMMORA_API}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) return null;

    const data = await res.json();

    // Direct login success
    if (data.access_token) {
      cachedToken = {
        token: data.access_token,
        expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
      };
      return cachedToken.token;
    }

    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  // Verify the user is authenticated via NextAuth
  const secureCookie = req.nextUrl.protocol === "https:";
  const jwt = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie });
  if (!jwt?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { path, method, payload, enterprise } = body as {
    path?: string;
    method?: string;
    payload?: unknown;
    enterprise?: boolean;
  };

  if (!path || typeof path !== "string" || !path.startsWith("/api/v1/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  // Token acquisition order:
  // 1. User's own glimmoraAccessToken from JWT (best — scoped to their tenant)
  // 2. Enterprise service account (for enterprise/admin users, or when enterprise=true)
  // 3. Contributor service account (last resort)
  let token: string | undefined = jwt.glimmoraAccessToken as string | undefined;

  const jwtRole = jwt.role as string | undefined;
  const needsEnterpriseToken =
    !token &&
    (enterprise || jwtRole === "enterprise" || jwtRole === "admin" || jwtRole === "super_admin");

  if (!token) {
    try {
      const origin = req.nextUrl.origin;
      const cookie = req.headers.get("cookie") ?? "";
      const role = needsEnterpriseToken ? "enterprise" : "";
      const tokenRes = await fetch(
        `${origin}/api/sow/token${role ? `?role=${role}` : ""}`,
        { headers: cookie ? { cookie } : {} },
      );
      const tokenJson = await tokenRes.json().catch(() => ({}));
      token = tokenJson?.token as string | undefined;
    } catch { /* fall through */ }
  }

  if (!token) {
    token = (await getGlimmoraToken()) ?? undefined;
  }

  if (!token) {
    return NextResponse.json(
      { error: "Unable to acquire API token. Check GLIMMORA_SERVICE_EMAIL/PASSWORD env vars." },
      { status: 503 },
    );
  }

  try {
    const backendFetch = (t: string) =>
      fetch(`${GLIMMORA_API}${path}`, {
        method: method || "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t}`,
        },
        ...(payload ? { body: JSON.stringify(payload) } : {}),
      });

    let res = await backendFetch(token);

    // On 401: bust cached token, re-acquire with the same scope, retry once
    if (res.status === 401) {
      cachedToken = null;
      try {
        const origin = req.nextUrl.origin;
        const cookie = req.headers.get("cookie") ?? "";
        const role = needsEnterpriseToken ? "enterprise" : "";
        const refreshRes = await fetch(
          `${origin}/api/sow/token${role ? `?role=${role}&force_refresh=1` : "?force_refresh=1"}`,
          { headers: cookie ? { cookie } : {} },
        );
        const refreshJson = await refreshRes.json().catch(() => ({}));
        const refreshedToken = refreshJson?.token as string | undefined;
        if (refreshedToken) {
          token = refreshedToken;
          res = await backendFetch(refreshedToken);
        }
      } catch { /* ignore — fall through to return the 401 */ }
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Proxy error" },
      { status: 500 },
    );
  }
}
