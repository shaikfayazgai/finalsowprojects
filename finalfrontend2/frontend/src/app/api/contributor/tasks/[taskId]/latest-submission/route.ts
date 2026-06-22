import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

function authHeader(req: NextRequest): Record<string, string> {
  const token = req.headers.get("authorization") ?? "";
  return token ? { Authorization: token } : {};
}

/* ── GET /api/contributor/tasks/[taskId]/latest-submission ──────────────────── */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { taskId } = await params;
  const headers = { "Content-Type": "application/json", ...authHeader(req) };
  const url     = `${BACKEND}/api/contributor/tasks/${encodeURIComponent(taskId)}/latest-submission`;

  /* 1 ─ Try real backend */
  const backendRes = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  /* 2 ─ Backend 200 → forward as-is */
  if (backendRes.ok) {
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: 200 });
  }

  /*
   * 3 ─ Backend 404 (no submission yet for this task, or demo task).
   *     Return a clear 404 so the UI can show "No submission found".
   */
  if (backendRes.status === 404) {
    return NextResponse.json(
      { detail: "No submission found for this task." },
      { status: 404 },
    );
  }

  /* 4 ─ Any other backend error → forward */
  const errBody = await backendRes.json().catch(() => ({
    detail: `Backend error ${backendRes.status}`,
  }));
  return NextResponse.json(errBody, { status: backendRes.status });
}
