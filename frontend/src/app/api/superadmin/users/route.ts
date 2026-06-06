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

function toErrorMessage(data: Record<string, unknown>, fallback: string): string {
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const first = data.errors[0] as { field?: string; message?: string };
    if (typeof first?.field === "string" && typeof first?.message === "string") {
      return `${first.field}: ${first.message}`;
    }
    if (typeof first?.message === "string") return first.message;
  }
  if (typeof data.message === "string") return data.message;
  if (typeof data.error === "string") return data.error;
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item !== null) {
          const x = item as { msg?: string };
          if (typeof x.msg === "string") return x.msg;
        }
        return "invalid";
      })
      .join("; ");
  }
  return fallback;
}

export async function POST(req: NextRequest) {
  const secureCookie = req.nextUrl.protocol === "https:";
  const jwt = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie });
  let token = (jwt as { glimmoraAccessToken?: string } | null)?.glimmoraAccessToken;
  if (!token) token = (await getAdminToken()) ?? undefined;

  if (!token) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in as admin or set GLIMMORA_ADMIN_EMAIL and GLIMMORA_ADMIN_PASSWORD in .env." },
      { status: 401 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const upstream = `${GLIMMORA_API}/api/superadmin/users`;
  const send = (bearer: string) =>
    fetch(upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearer}`,
      },
      body: JSON.stringify(body),
    });

  let res = await send(token);
  let data = await res.json().catch(() => ({} as Record<string, unknown>));

  if (res.status === 401 && ADMIN_EMAIL && ADMIN_PASSWORD) {
    cachedAdminToken = null;
    const fresh = await getAdminToken();
    if (fresh) {
      res = await send(fresh);
      data = await res.json().catch(() => ({} as Record<string, unknown>));
    }
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: toErrorMessage(data, "Failed to create user") },
      { status: res.status },
    );
  }

  return NextResponse.json(data, { status: res.status });
}
