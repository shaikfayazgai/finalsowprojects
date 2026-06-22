/**
 * Proxy: POST /api/enterprise/projects/[projectId]/milestones/[milestoneId]/accept
 *
 * Forwards to POST /api/v1/projects/{projectId}/milestones/{milestoneId}/accept
 * on the enterprise backend.
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; milestoneId: string }> },
) {
  const guard = await requireRole(["enterprise", "admin", "super_admin"]);
  if (guard instanceof NextResponse) return guard;

  const token = await getBearer(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, milestoneId } = await params;
  const upstream = `${GLIMMORA_API}/api/v1/projects/${encodeURIComponent(projectId)}/milestones/${encodeURIComponent(milestoneId)}/accept`;

  try {
    const res = await fetch(upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[api/enterprise/projects/milestones/accept POST]", err);
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}
