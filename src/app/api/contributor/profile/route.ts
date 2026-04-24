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

/* ── GET  /api/contributor/profile ───────────────────────────────────────── */
/* ── PATCH /api/contributor/profile ───────────────────────────────────────── */
/*
 * Backend expects header: X-Contributor-Id (see OpenAPI)
 */

export async function GET(req: NextRequest) {
  const headers = forwardHeaders(req);
  const url = `${BACKEND}/api/contributor/profile`;

  try {
    console.log(`[profile/route] → GET ${url}`);
    const backendRes = await fetch(url, { method: "GET", headers, cache: "no-store" });
    console.log(`[profile/route] ← ${backendRes.status}`);

    if (backendRes.ok) {
      const data = await backendRes.json().catch(() => ({}));
      return NextResponse.json(data, { status: 200 });
    }

    if (backendRes.status === 422) {
      const body = await backendRes.json().catch(() => ({ detail: "Validation error" }));
      return NextResponse.json(body, { status: 422 });
    }

    if (backendRes.status === 404) {
      return NextResponse.json({ detail: "Profile not found." }, { status: 404 });
    }

    const errBody = await backendRes.json().catch(() => ({
      detail: `Backend error ${backendRes.status}`,
    }));
    return NextResponse.json(errBody, { status: backendRes.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[profile/route] ✗ connection error — ${message} | url: ${url}`);
    return NextResponse.json(
      { detail: `Profile service unavailable: ${message}` },
      { status: 502 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  const headers = forwardHeaders(req);
  const url = `${BACKEND}/api/contributor/profile`;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body." }, { status: 400 });
  }

  try {
    console.log(`[profile/route] → PATCH ${url}`);
    const backendRes = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });
    console.log(`[profile/route] ← ${backendRes.status}`);

    if (backendRes.ok) {
      const data = await backendRes.json().catch(() => ({}));
      return NextResponse.json(data, { status: 200 });
    }

    if (backendRes.status === 422) {
      const errBody = await backendRes.json().catch(() => ({ detail: "Validation error" }));
      return NextResponse.json(errBody, { status: 422 });
    }

    if (backendRes.status === 404) {
      return NextResponse.json({ detail: "Profile not found." }, { status: 404 });
    }

    const errBody = await backendRes.json().catch(() => ({
      detail: `Backend error ${backendRes.status}`,
    }));
    return NextResponse.json(errBody, { status: backendRes.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[profile/route] ✗ connection error (PATCH) — ${message} | url: ${url}`);
    return NextResponse.json(
      { detail: `Profile service unavailable: ${message}` },
      { status: 502 },
    );
  }
}
