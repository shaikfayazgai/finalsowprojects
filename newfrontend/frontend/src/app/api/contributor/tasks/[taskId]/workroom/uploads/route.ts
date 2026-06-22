import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const BACKEND =
  process.env.BACKEND_SERVICE_URL ??
  process.env.INTERNAL_BACKEND_URL ??
  process.env.NEXT_PUBLIC_GLIMMORA_API_URL ??
  process.env.GLIMMORA_API_URL ??
  "http://localhost:9000";

/* ── POST /api/contributor/tasks/[taskId]/workroom/uploads ──────────────────
 * Multipart upload — can't use proxyToBackendService (it reads the body as
 * text, which corrupts binary files). Inject the NextAuth-held backend token
 * and forward the FormData with its multipart boundary intact.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { taskId } = await params;
  const url = `${BACKEND}/api/contributor/tasks/${encodeURIComponent(taskId)}/workroom/uploads`;

  const session = await auth();
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;
  if (!token) {
    return NextResponse.json({ detail: "Unauthorized." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ detail: "Invalid form data." }, { status: 400 });
  }

  // Do NOT set Content-Type — fetch sets the multipart boundary from the body.
  const backendRes = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
    cache: "no-store",
  });

  const data = await backendRes.json().catch(() => ({
    detail: `Backend error ${backendRes.status}`,
  }));
  return NextResponse.json(data, { status: backendRes.status });
}
