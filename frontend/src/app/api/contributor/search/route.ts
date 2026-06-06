import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

function forwardHeaders(req: NextRequest): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const auth = req.headers.get("authorization");
  if (auth) h.Authorization = auth;
  const contributorId = req.headers.get("x-contributor-id");
  if (contributorId) h["X-Contributor-Id"] = contributorId;
  return h;
}

/* ── GET /api/contributor/search?q=...&limit=20 ──────────────────────────── */

export async function GET(req: NextRequest) {
  const headers = forwardHeaders(req);
  const url = `${BACKEND}/api/contributor/search${req.nextUrl.search}`;

  try {
    const backendRes = await fetch(url, { method: "GET", headers, cache: "no-store" });

    if (backendRes.ok) {
      const data = await backendRes.json().catch(() => ({ query: "", total: 0, results: [] }));
      return NextResponse.json(data, { status: 200 });
    }

    const errBody = await backendRes.json().catch(() => ({
      detail: `Backend error ${backendRes.status}`,
    }));
    return NextResponse.json(errBody, { status: backendRes.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[search/route] ✗ connection error — ${message} | url: ${url}`);
    return NextResponse.json(
      { detail: `Search service unavailable: ${message}` },
      { status: 502 },
    );
  }
}
