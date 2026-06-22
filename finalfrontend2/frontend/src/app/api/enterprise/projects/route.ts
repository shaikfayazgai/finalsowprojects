/**
 * Proxy: GET /api/enterprise/projects
 *
 * Forwards to GET /api/v1/portfolio/projects on the enterprise backend.
 * Injects the session bearer token so the backend can identify the owner.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireRole } from "@/lib/auth/require-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GLIMMORA_API =
  process.env.GLIMMORA_API_URL ?? process.env.NEXT_PUBLIC_GLIMMORA_API_URL;

async function getBearer(req: NextRequest): Promise<string | null> {
  const secureCookie = req.nextUrl.protocol === "https:";
  const jwt = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie });
  return (jwt as { glimmoraAccessToken?: string } | null)?.glimmoraAccessToken ?? null;
}

export async function GET(req: NextRequest) {
  const guard = await requireRole(["enterprise", "admin", "super_admin"]);
  if (guard instanceof NextResponse) return guard;

  const token = await getBearer(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(`${GLIMMORA_API}/api/v1/portfolio/projects`);
  // Forward any query params (e.g. status=completed)
  req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[api/enterprise/projects GET]", err);
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}
