/**
 * GET /api/contributor/tasks
 *
 * Proxy to the real FastAPI backend (freelancer service :8104 via gateway :9000).
 * Backend endpoint: GET /api/contributor/tasks
 *
 * Supported query params forwarded as-is to the backend:
 *   status      string | null   — filter by task status
 *   category    string | null   — filter by category
 *   priority    string | null   — filter by priority
 *   page        integer         — default 1
 *   page_size   integer         — default 20
 */

import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

function authHeader(req: NextRequest): Record<string, string> {
  const token = req.headers.get("authorization") ?? "";
  return token ? { Authorization: token } : {};
}

/* ── GET /api/contributor/tasks ─────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  const headers = { "Content-Type": "application/json", ...authHeader(req) };

  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const url = `${BACKEND}/api/contributor/tasks${qs ? `?${qs}` : ""}`;

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

    /* 422 — validation error */
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
      { detail: "Failed to reach contributor tasks service." },
      { status: 502 },
    );
  }
}
