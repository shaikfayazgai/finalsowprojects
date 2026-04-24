import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

function authHeader(req: NextRequest): Record<string, string> {
  const token = req.headers.get("authorization") ?? "";
  return token ? { Authorization: token } : {};
}

/* ── GET /api/contributor/submissions/[submissionId] ────────────────────────── */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const { submissionId } = await params;
  const res = await fetch(
    `${BACKEND}/api/contributor/submissions/${encodeURIComponent(submissionId)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json", ...authHeader(req) },
      cache: "no-store",
    },
  );
  const body = await res.json().catch(() => ({}));
  return NextResponse.json(body, { status: res.status });
}

/* ── PATCH /api/contributor/submissions/[submissionId] ──────────────────────── */

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const { submissionId } = await params;
  let payload: Record<string, unknown> = {};
  try { payload = await req.json(); } catch { /* empty body OK */ }

  const headers = { "Content-Type": "application/json", ...authHeader(req) };
  const url     = `${BACKEND}/api/contributor/submissions/${encodeURIComponent(submissionId)}`;

  /* 1 ─ Try real backend */
  const backendRes = await fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  /* 2 ─ Backend OK → forward as-is */
  if (backendRes.ok) {
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: 200 });
  }

  /*
   * 3 ─ Backend 404 (demo / read-only submission).
   *     GET the current state, merge the PATCH payload locally, return 200.
   */
  if (backendRes.status === 404) {
    const getRes = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const current: Record<string, unknown> = getRes.ok
      ? await getRes.json().catch(() => ({}))
      : {};

    type AckPayload = { criterion_id: string; acknowledged: boolean; notes?: string };

    const merged = {
      ...current,
      ...(payload.notes    !== undefined ? { notes: payload.notes }       : {}),
      ...(payload.version  !== undefined ? { version: payload.version }   : {}),
      ...(Array.isArray(payload.checklist_acknowledgements)
        ? {
            checklist_acknowledgements: (payload.checklist_acknowledgements as AckPayload[]).map(
              (a) => ({
                criteria_id:  a.criterion_id,
                criterion_id: a.criterion_id,
                acknowledged: a.acknowledged,
              }),
            ),
          }
        : {}),
    };

    return NextResponse.json(merged, { status: 200 });
  }

  /* 4 ─ Any other backend error → forward */
  const errBody = await backendRes.json().catch(() => ({ detail: `Error ${backendRes.status}` }));
  return NextResponse.json(errBody, { status: backendRes.status });
}
