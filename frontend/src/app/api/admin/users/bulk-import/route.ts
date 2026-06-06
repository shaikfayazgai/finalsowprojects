import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy for manual employee bulk-import (NO HRIS) → superadmin-service.
 * Forwards the multipart upload + commit/sendCredentials query flags + Bearer.
 * Backend: POST /api/admin/users/bulk-import?commit=&sendCredentials= (two-phase:
 * commit=false → validated preview; commit=true → create accounts + email creds).
 */
const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

export async function POST(req: NextRequest) {
  const qs = new URL(req.url).search;
  const auth = req.headers.get("authorization") ?? "";
  try {
    // Pass the raw multipart body + content-type straight through.
    const body = await req.arrayBuffer();
    const r = await fetch(`${BACKEND}/api/admin/users/bulk-import${qs}`, {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": req.headers.get("content-type") ?? "application/octet-stream",
      },
      body,
      signal: AbortSignal.timeout(60000),
    });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch {
    return NextResponse.json({ detail: "Import failed" }, { status: 500 });
  }
}
