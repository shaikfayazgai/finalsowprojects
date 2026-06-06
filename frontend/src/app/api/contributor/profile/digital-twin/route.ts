import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

function forwardHeaders(req: NextRequest): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const token = req.headers.get("authorization") ?? "";
  if (token) h.Authorization = token;
  const contributorId = req.headers.get("x-contributor-id");
  if (contributorId) h["X-Contributor-Id"] = contributorId;
  return h;
}

/* ── GET /api/contributor/profile/digital-twin ─────────────────────────────── */

export async function GET(req: NextRequest) {
  const headers = forwardHeaders(req);
  const url = `${BACKEND}/api/contributor/profile/digital-twin`;

  try {
    console.log(`[profile/digital-twin/route] → GET ${url}`);
    const backendRes = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    console.log(`[profile/digital-twin/route] ← ${backendRes.status}`);

    if (backendRes.ok) {
      const data = await backendRes.json().catch(() => ({}));
      return NextResponse.json(data, { status: 200 });
    }

    if (backendRes.status === 422) {
      const body = await backendRes.json().catch(() => ({ detail: "Validation error" }));
      return NextResponse.json(body, { status: 422 });
    }

    if (backendRes.status === 404) {
      return NextResponse.json({ detail: "Digital twin not found." }, { status: 404 });
    }

    const errBody = await backendRes.json().catch(() => ({
      detail: `Backend error ${backendRes.status}`,
    }));
    return NextResponse.json(errBody, { status: backendRes.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[profile/digital-twin/route] ✗ connection error — ${message} | url: ${url}`);
    return NextResponse.json(
      { detail: `Digital twin service unavailable: ${message}` },
      { status: 502 },
    );
  }
}
