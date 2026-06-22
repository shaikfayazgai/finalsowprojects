import { NextResponse } from "next/server";

const GLIMMORA_API =
  process.env.GLIMMORA_API_URL ?? process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? "";

/**
 * GET /api/config/contributor-pricing
 *
 * Server-side proxy to GET /api/v1/config/contributor-pricing on the Glimmora
 * backend.  No authentication required — the upstream endpoint is public.
 *
 * Running this server-side avoids CORS issues and lets us handle cold-start
 * delays from the Render hosting environment cleanly.
 */
export async function GET() {
  if (!GLIMMORA_API) {
    return NextResponse.json({ error: "API base URL not configured" }, { status: 503 });
  }

  try {
    const res = await fetch(
      `${GLIMMORA_API}/api/v1/config/contributor-pricing`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        // 30 s timeout — covers Render cold-start delays
        signal: AbortSignal.timeout(30_000),
        // Never cache stale pricing on the CDN edge
        cache: "no-store",
      },
    );

    if (!res.ok) {
      // Backend returned a non-2xx (most commonly 404 when the endpoint isn't
      // deployed yet).  Return 200 with { data: null } so the browser never
      // logs a console error — the client hook will fall back to stored values.
      return NextResponse.json({ data: null }, { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json(data, {
      status: 200,
      headers: {
        // Short cache — allow edge/browser to reuse for 60 s
        "Cache-Control": "public, max-age=60, stale-while-revalidate=120",
      },
    });
  } catch {
    // Network error or timeout — return 200 with null so the browser never
    // logs a console error and the client hook falls back to stored values.
    return NextResponse.json({ data: null }, { status: 200 });
  }
}
