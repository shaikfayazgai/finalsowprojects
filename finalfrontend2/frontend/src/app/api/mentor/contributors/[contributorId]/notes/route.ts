/**
 * GET /api/mentor/contributors/:contributorId/notes
 *
 * Proxy to the real mentor backend.
 * The backend has no standalone notes-list endpoint; notes are returned
 * inline inside GET /api/mentor/mentorship/{mentee_id}.
 * We fetch that detail response and re-shape it as { items } so the UI
 * contract is preserved.
 *
 * POST /api/mentor/contributors/:contributorId/notes
 *
 * Proxy to POST /api/mentor/mentorship/{mentee_id}/note on the backend.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

function authHeader(req: NextRequest): Record<string, string> {
  const token = req.headers.get("authorization") ?? "";
  return token ? { Authorization: token } : {};
}

/* ── GET /api/mentor/contributors/[contributorId]/notes ─────────────────────
 * Fetches GET /api/mentor/mentorship/{mentee_id} from the backend and
 * extracts the embedded notes array, returning { items: [...] }.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ contributorId: string }> },
) {
  const { contributorId } = await params;
  if (!contributorId) {
    return NextResponse.json({ error: "Missing contributorId" }, { status: 400 });
  }

  const headers = { "Content-Type": "application/json", ...authHeader(req) };
  const url = `${BACKEND}/api/mentor/mentorship/${encodeURIComponent(contributorId)}`;

  try {
    const backendRes = await fetch(url, { method: "GET", headers, cache: "no-store" });

    if (backendRes.ok) {
      const body = await backendRes.json().catch(() => ({}));
      // Backend returns { success, data: { ...mentee, notes: [...] } }
      const notes: unknown[] = body?.data?.notes ?? [];
      return NextResponse.json({ items: notes }, { status: 200 });
    }

    if (backendRes.status === 422) {
      const body = await backendRes.json().catch(() => ({ detail: "Validation error" }));
      return NextResponse.json(body, { status: 422 });
    }

    const errBody = await backendRes.json().catch(() => ({
      detail: `Backend error ${backendRes.status}`,
    }));
    return NextResponse.json(errBody, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { detail: "Failed to reach mentor service." },
      { status: 502 },
    );
  }
}

/* ── POST /api/mentor/contributors/[contributorId]/notes ────────────────────
 * Forwards to POST /api/mentor/mentorship/{mentee_id}/note.
 * Expects JSON body: { body: string, attachments?: string[] }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ contributorId: string }> },
) {
  const { contributorId } = await params;
  if (!contributorId) {
    return NextResponse.json({ error: "Missing contributorId" }, { status: 400 });
  }

  const headers = { "Content-Type": "application/json", ...authHeader(req) };
  const url = `${BACKEND}/api/mentor/mentorship/${encodeURIComponent(contributorId)}/note`;

  let requestBody: unknown;
  try {
    requestBody = await req.json();
  } catch {
    requestBody = {};
  }

  try {
    const backendRes = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      cache: "no-store",
    });

    if (backendRes.ok) {
      const data = await backendRes.json().catch(() => ({}));
      return NextResponse.json(data, { status: 200 });
    }

    if (backendRes.status === 422) {
      const body = await backendRes.json().catch(() => ({ detail: "Validation error" }));
      return NextResponse.json(body, { status: 422 });
    }

    const errBody = await backendRes.json().catch(() => ({
      detail: `Backend error ${backendRes.status}`,
    }));
    return NextResponse.json(errBody, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { detail: "Failed to reach mentor service." },
      { status: 502 },
    );
  }
}
