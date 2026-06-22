import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

/* ── GET /api/public/credentials/[shareId] ──────────────────────────────────
 *  Public (unauthenticated) endpoint — no auth header required.
 *  Returns safe portfolio fields only; excludes emails, PODL hashes, certs.
 * ─────────────────────────────────────────────────────────────────────────── */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shareId: string }> },
) {
  const { shareId } = await params;
  const url = `${BACKEND}/api/public/credentials/${encodeURIComponent(shareId)}`;

  try {
    console.log(`[public-credentials/route] → GET ${url}`);
    const backendRes = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    console.log(`[public-credentials/route] ← ${backendRes.status}`);

    if (backendRes.ok) {
      const data = await backendRes.json().catch(() => ({}));
      return NextResponse.json(data, { status: 200 });
    }

    if (backendRes.status === 422) {
      const errBody = await backendRes.json().catch(() => ({ detail: "Validation error" }));
      return NextResponse.json(errBody, { status: 422 });
    }

    if (backendRes.status === 404) {
      return NextResponse.json({ detail: "Shared credential not found." }, { status: 404 });
    }

    const errBody = await backendRes.json().catch(() => ({
      detail: `Backend error ${backendRes.status}`,
    }));
    return NextResponse.json(errBody, { status: backendRes.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[public-credentials/route] ✗ connection error — ${message} | url: ${url}`);
    return NextResponse.json(
      { detail: `Public credentials service unavailable: ${message}` },
      { status: 502 },
    );
  }
}
