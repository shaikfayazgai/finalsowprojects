/**
 * POST /api/mentor/notes  → proxy to FastAPI mentor service
 *
 * Backend route: POST /api/mentor/mentorship/{mentee_id}/note
 *   Body (backend): { body: string, attachments?: object[] }
 *
 * Frontend callers pass:
 *   { contributorId, body, visibility?, sessionId?, tenantId? }
 * We forward contributorId as the {mentee_id} path param and body as the note body.
 * The backend enforces session-ownership via Bearer token; extra frontend fields
 * (visibility, sessionId, tenantId) are not forwarded — the backend does not use them.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

function authHeader(req: NextRequest): Record<string, string> {
  const token = req.headers.get("authorization") ?? "";
  return token ? { Authorization: token } : {};
}

export async function POST(req: NextRequest) {
  let raw: Record<string, unknown>;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const menteeId = raw.contributorId;
  if (!menteeId || typeof menteeId !== "string") {
    return NextResponse.json(
      { error: "contributorId is required to identify the mentee" },
      { status: 400 },
    );
  }

  const backendBody = {
    body: raw.body,
    attachments: Array.isArray(raw.attachments) ? raw.attachments : [],
  };

  const url = `${BACKEND}/api/mentor/mentorship/${encodeURIComponent(menteeId)}/note`;

  try {
    const backendRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(req),
      },
      body: JSON.stringify(backendBody),
      cache: "no-store",
    });

    if (backendRes.ok) {
      const data = await backendRes.json().catch(() => ({}));
      // Backend wraps in { success, data }; surface as { note: data.data } to match
      // the shape the UI already expects from the Prisma implementation.
      const note = (data as { data?: unknown }).data ?? data;
      return NextResponse.json({ note }, { status: 201 });
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
