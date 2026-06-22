/**
 * GET /api/credentials/mine
 *
 * Lists the contributor's own credentials. Proxied to the real backend at
 * /api/contributor/credentials (freelancer service :8104 via gateway :9000).
 * The backend identifies the caller from the forwarded Authorization header.
 *
 * Supported query params forwarded as-is:
 *   status     "issued" | "revoked"
 *   limit      integer (1–200, default 100)
 *   page       integer (default 1)
 *   page_size  integer (default 20, max 100)
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

function authHeader(req: NextRequest): Record<string, string> {
  const token = req.headers.get("authorization") ?? "";
  return token ? { Authorization: token } : {};
}

export async function GET(req: NextRequest) {
  const headers = { "Content-Type": "application/json", ...authHeader(req) };

  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const url = `${BACKEND}/api/contributor/credentials${qs ? `?${qs}` : ""}`;

  try {
    const backendRes = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (backendRes.ok) {
      const data = await backendRes.json().catch(() => ({}));
      return NextResponse.json(data, { status: 200 });
    }

    /* 422 — validation error (e.g. invalid status value) */
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
      { detail: "Failed to reach credentials service." },
      { status: 502 },
    );
  }
}
