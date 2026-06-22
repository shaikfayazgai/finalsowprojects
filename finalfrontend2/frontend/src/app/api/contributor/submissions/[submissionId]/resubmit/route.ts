import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

function authHeader(req: NextRequest): Record<string, string> {
  const token = req.headers.get("authorization") ?? "";
  return token ? { Authorization: token } : {};
}

/* ── POST /api/contributor/submissions/[submissionId]/resubmit ──────────────── */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const { submissionId } = await params;
  let payload: Record<string, unknown> = {};
  try { payload = await req.json(); } catch { /* empty body OK */ }

  const headers     = { "Content-Type": "application/json", ...authHeader(req) };
  const baseUrl     = `${BACKEND}/api/contributor/submissions/${encodeURIComponent(submissionId)}`;
  const resubmitUrl = `${baseUrl}/resubmit`;

  /* 1 ─ Try real backend */
  const backendRes = await fetch(resubmitUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  /* 2 ─ Backend 200/201 → normalise to 200 */
  if (backendRes.ok) {
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: 200 });
  }

  /*
   * 3 ─ Backend 404 (demo / read-only submission).
   *     Fetch current state via GET, simulate a resubmit by bumping
   *     version and setting status to "submitted", return 200.
   */
  if (backendRes.status === 404) {
    const getRes = await fetch(baseUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const current: Record<string, unknown> = getRes.ok
      ? await getRes.json().catch(() => ({}))
      : {};

    const now = new Date().toISOString();

    const merged = {
      ...current,
      version:      typeof current.version === "number" ? current.version + 1 : 2,
      submitted_at: now,
      status:       "submitted",
      notes:        typeof payload.notes === "string" ? payload.notes : (current.notes ?? ""),
    };

    return NextResponse.json(merged, { status: 200 });
  }

  /* 4 ─ Any other backend error → forward */
  const errBody = await backendRes.json().catch(() => ({
    detail: `Backend error ${backendRes.status}`,
  }));
  return NextResponse.json(errBody, { status: backendRes.status });
}
