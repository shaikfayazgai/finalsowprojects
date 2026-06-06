import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

function authHeader(req: NextRequest): Record<string, string> {
  const token = req.headers.get("authorization") ?? "";
  return token ? { Authorization: token } : {};
}

/* ── GET /api/contributor/credentials ──────────────────────────────────────── */
/*
 * Supported query params (forwarded as-is to backend):
 *   skill       string | null   — filter by skill tag
 *   date_filter string | null   — "30d" | "90d" | "6m"
 *   page        integer         — default 1, min 1
 *   page_size   integer         — default 20, max 100
 */

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

    /* 422 — validation error (e.g. invalid date_filter value) */
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
