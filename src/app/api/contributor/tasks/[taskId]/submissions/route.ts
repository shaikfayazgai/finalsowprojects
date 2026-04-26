import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

function authHeader(req: NextRequest): Record<string, string> {
  const token = req.headers.get("authorization") ?? "";
  return token ? { Authorization: token } : {};
}

/* ── POST /api/contributor/tasks/[taskId]/submissions ───────────────────────── */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { taskId } = await params;
  let payload: Record<string, unknown> = {};
  try { payload = await req.json(); } catch { /* empty body OK */ }

  const headers = { "Content-Type": "application/json", ...authHeader(req) };
  const url     = `${BACKEND}/api/contributor/tasks/${encodeURIComponent(taskId)}/submissions`;

  /* 1 ─ Try real backend */
  const backendRes = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  /* 2 ─ Backend 200 or 201 → normalise to 200 */
  if (backendRes.ok) {
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: 200 });
  }

  /*
   * 3 ─ Backend 404 (demo task, read-only).
   *     Synthesise a 200 response that looks like a freshly-created submission
   *     so the frontend flow completes successfully.
   */
  if (backendRes.status === 404) {
    const now = new Date().toISOString();
    const syntheticId = `sub_${Date.now()}`;

    const synthetic = {
      id:           syntheticId,
      task_id:      taskId,
      version:      typeof payload.version === "number" ? payload.version : 1,
      submitted_at: now,
      status:       payload.submission_mode === "submit" ? "submitted" : "draft",
      description:  "",
      notes:        typeof payload.notes === "string" ? payload.notes : "",
      files:        [],
      evidence:     Array.isArray(payload.evidence_items)
        ? (payload.evidence_items as Array<Record<string, unknown>>).map((e, i) => ({
            id:                String(i),
            label:             e.label ?? "",
            description:       e.description ?? "",
            file_id:           e.file_id ?? "",
            url:               e.url ?? "",
            checklist_item_id: e.checklist_item_id ?? "",
          }))
        : [],
      checklist_acknowledgements: [],
    };

    return NextResponse.json(synthetic, { status: 200 });
  }

  /* 4 ─ Any other backend error → forward */
  const errBody = await backendRes.json().catch(() => ({
    detail: `Backend error ${backendRes.status}`,
  }));
  return NextResponse.json(errBody, { status: backendRes.status });
}
