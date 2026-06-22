/**
 * Proxy: GET /api/enterprise/projects/[projectId]
 *
 * Forwards to GET /api/v1/projects/{projectId} on the enterprise backend.
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const guard = await requireRole(["enterprise", "admin", "super_admin"]);
  if (guard instanceof NextResponse) return guard;

  const token = await getBearer(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const upstream = `${GLIMMORA_API}/api/v1/projects/${encodeURIComponent(projectId)}`;

  try {
    const res = await fetch(upstream, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[api/enterprise/projects/[projectId] GET]", err);
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}
