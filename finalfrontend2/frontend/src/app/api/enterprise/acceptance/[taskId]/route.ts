/**
 * Enterprise acceptance / rework decision endpoint — PROXY to FastAPI backend.
 *
 * POST → /api/v1/review/deliverables/{taskId}/decision  (enterprise:8103)
 * GET  → /api/v1/review/deliverables/{taskId}           (enterprise:8103)
 *
 * The backend /decision endpoint accepts:
 *   { decision: "approve"|"reject"|"rework", note?: string }
 * and returns the updated deliverable row (contains status, decidedAt, …).
 *
 * The GET path returns the full deliverable row — callers that previously
 * expected `{ decisions: [...] }` will receive the deliverable object instead;
 * the shape is a superset (includes status, decidedAt, decisionNote, etc.).
 *
 * Public contract (HTTP methods) is unchanged: POST and GET are both exported.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND =
  process.env.NEXT_PUBLIC_GLIMMORA_API_URL ??
  process.env.GLIMMORA_API_URL ??
  "";

function authHeader(req: NextRequest): Record<string, string> {
  const token = req.headers.get("authorization") ?? "";
  return token ? { Authorization: token } : {};
}

/* ─────────────────────────── POST ──────────────────────────────────── */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { taskId } = await params;
  if (!taskId) {
    return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = `${BACKEND}/api/v1/review/deliverables/${encodeURIComponent(taskId)}/decision`;

  try {
    const backendRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(req),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach acceptance service." },
      { status: 502 },
    );
  }
}

/* ─────────────────────────── GET ───────────────────────────────────── */

/**
 * Returns the full deliverable row for the given taskId, which includes the
 * current status, decidedAt, and decisionNote fields set by prior decisions.
 *
 * Previously returned: { decisions: [...] } (Prisma acceptanceDecision list)
 * Now returns:         deliverable object with status / decidedAt / decisionNote
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { taskId } = await params;
  if (!taskId) {
    return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const url = `${BACKEND}/api/v1/review/deliverables/${encodeURIComponent(taskId)}${qs ? `?${qs}` : ""}`;

  try {
    const backendRes = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(req),
      },
      cache: "no-store",
    });

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach acceptance service." },
      { status: 502 },
    );
  }
}
