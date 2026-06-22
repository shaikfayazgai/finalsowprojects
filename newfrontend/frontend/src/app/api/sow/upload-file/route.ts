/**
 * POST /api/sow/upload-file — upload a SOW document to Blob (via gateway →
 * enterprise backend), returns { fileName, fileUrl, fileSize }. The author flow
 * uploads here first, then includes fileUrl in the JSON create.
 *
 * Custom handler (NOT proxyToBackendService): that helper reads the body as
 * text(), which corrupts binary multipart uploads. Here we forward the raw bytes
 * + the original Content-Type (preserving the multipart boundary).
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function backendBase(): string {
  return (
    process.env.BACKEND_SERVICE_URL ??
    process.env.GLIMMORA_API_BASE_URL ??
    "http://127.0.0.1:9000"
  );
}

export async function POST(req: Request) {
  const session = await auth();
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const buf = await req.arrayBuffer();
  const contentType = req.headers.get("content-type") || "application/octet-stream";
  try {
    const res = await fetch(`${backendBase()}/api/v1/sow/upload-file`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": contentType },
      body: Buffer.from(buf),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "BACKEND_UNAVAILABLE" }, { status: 503 });
  }
}
