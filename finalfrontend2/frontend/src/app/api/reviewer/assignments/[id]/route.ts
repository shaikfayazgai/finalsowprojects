/**
 * Proxy: PATCH /api/reviewer/assignments/[id]
 * Forwards to reviewer backend PATCH /api/v1/reviewer/assignments/{id}
 * Body: { status, comment, decision, data }
 * Returns { assignment: ... }
 */

import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/require-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GLIMMORA_API =
  process.env.GLIMMORA_API_URL ?? process.env.NEXT_PUBLIC_GLIMMORA_API_URL;

/** Map frontend decision kind → backend status */
const DECISION_STATUS_MAP: Record<string, string> = {
  accept: "approved",
  rework: "rework",
  reject: "rejected",
};

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const guard = await requireRole(["reviewer", "admin", "super_admin"]);
  if (guard instanceof NextResponse) return guard;

  const secureCookie = req.nextUrl.protocol === "https:";
  const jwt = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie });
  const token = (jwt as { glimmoraAccessToken?: string } | null)?.glimmoraAccessToken;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Map decision → status for the backend
  const decision = body.decision as string | undefined;
  const status = decision
    ? (DECISION_STATUS_MAP[decision] ?? decision)
    : (body.status as string | undefined);

  const upstreamBody: Record<string, unknown> = { status };
  if (body.comment) {
    upstreamBody.data = { comment: body.comment, decision, agreedWithMentor: body.agreedWithMentor };
  }
  if (body.data) {
    upstreamBody.data = { ...(upstreamBody.data as Record<string, unknown> ?? {}), ...(body.data as Record<string, unknown>) };
  }

  try {
    const res = await fetch(
      `${GLIMMORA_API}/api/v1/reviewer/assignments/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(upstreamBody),
        cache: "no-store",
      },
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[api/reviewer/assignments/[id] PATCH]", err);
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}
