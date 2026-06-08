import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireRole } from "@/lib/auth/require-role";
import { backendBaseForPath } from "@/lib/api/backend-router";

const GLIMMORA_API = backendBaseForPath("/api/v1/auth/login");
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

async function resolveCallerToken(req: NextRequest, body?: Record<string, unknown>): Promise<string | null> {
  const secureCookie = req.nextUrl.protocol === "https:";
  const jwt = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie });
  if (!jwt?.email) {
    return null;
  }

  const headerAuth = req.headers.get("authorization") || "";
  const headerToken = headerAuth.toLowerCase().startsWith("bearer ")
    ? headerAuth.slice(7).trim()
    : undefined;

  const bodyToken = typeof body?.accessToken === "string" ? body.accessToken : undefined;
  if (body && "accessToken" in body) delete body.accessToken;

  let token = bodyToken || headerToken || (jwt.glimmoraAccessToken as string | undefined);
  if (!token) {
    token = (await getAdminToken()) ?? undefined;
  }
  return token ?? null;
}

export async function GET(req: NextRequest) {
  // Authorization — reviewer invitations are enterprise + admin only.
  const guard = await requireRole(["enterprise", "admin", "super_admin"]);
  if (guard instanceof NextResponse) return guard;

  const token = await resolveCallerToken(req);
  if (!token) {
    return NextResponse.json(
      { error: "No admin token available. Please sign in again as enterprise admin." },
      { status: 503 },
    );
  }

  const upstream = `${GLIMMORA_API}/api/v1/users/reviewers/list`;
  const res = await fetch(upstream, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && ADMIN_EMAIL && ADMIN_PASSWORD) {
    cachedAdminToken = null;
    const freshToken = await getAdminToken();
    if (freshToken) {
      const retry = await fetch(upstream, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${freshToken}`,
        },
      });
      const retryData = await retry.json().catch(() => ({}));
      return NextResponse.json(retryData, { status: retry.status });
    }
  }

  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  // Authorization — reviewer invitations are enterprise + admin only.
  const guard = await requireRole(["enterprise", "admin", "super_admin"]);
  if (guard instanceof NextResponse) return guard;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const token = await resolveCallerToken(req, body);

  if (!token) {
    return NextResponse.json(
      { error: "No admin token available. Please sign in again as enterprise admin." },
      { status: 503 },
    );
  }

  const resendExisting = Boolean(body.resendExisting);
  if ("resendExisting" in body) delete body.resendExisting;
  const upstream = resendExisting
    ? `${GLIMMORA_API}/api/v1/users/reviewers/resend-invite`
    : `${GLIMMORA_API}/api/v1/users`;

  const res = await fetch(upstream, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && ADMIN_EMAIL && ADMIN_PASSWORD) {
    cachedAdminToken = null;
    const freshToken = await getAdminToken();
    if (freshToken) {
      const retry = await fetch(upstream, {
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
