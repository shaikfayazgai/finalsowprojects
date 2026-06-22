import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

function authHeader(req: NextRequest): Record<string, string> {
  const token = req.headers.get("authorization") ?? "";
  return token ? { Authorization: token } : {};
}

/* ── DELETE /api/contributor/tasks/[taskId]/workroom/uploads/[uploadId] ───── */

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string; uploadId: string }> },
) {
  const { taskId, uploadId } = await params;
  const url = `${BACKEND}/api/contributor/tasks/${encodeURIComponent(taskId)}/workroom/uploads/${encodeURIComponent(uploadId)}`;

  const backendRes = await fetch(url, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...authHeader(req) },
    cache: "no-store",
  });

  // 200, 204, or 404 (already deleted) are all treated as success
  if (backendRes.ok || backendRes.status === 204 || backendRes.status === 404) {
    return new NextResponse(null, { status: 204 });
  }

  const errBody = await backendRes.json().catch(() => ({
    detail: `Backend error ${backendRes.status}`,
  }));
  return NextResponse.json(errBody, { status: backendRes.status });
}
