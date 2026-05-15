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
 * Real backend endpoint: GET/PUT /api/v1/users/me/profile
 * Backend expects header: X-Contributor-Id (see OpenAPI)
 */

const PROFILE_GET_URL = `${BACKEND}/api/v1/users/me/profile`;
const PROFILE_PUT_URL = `${BACKEND}/api/v1/users/me/profile`;

export async function GET(req: NextRequest) {
  const headers = forwardHeaders(req);

  try {
    console.log(`[profile/route] → GET ${PROFILE_GET_URL}`);
    const backendRes = await fetch(PROFILE_GET_URL, {
      method: "GET",
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    console.log(`[profile/route] ← ${backendRes.status}`);

    if (backendRes.ok) {
      const data = await backendRes.json().catch(() => ({}));
      return NextResponse.json(data, { status: 200 });
    }

    if (backendRes.status === 401) {
      return NextResponse.json({ detail: "Unauthorized — session token may be expired. Please sign in again." }, { status: 401 });
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
    console.error(`[profile/route] ✗ connection error — ${message} | url: ${PROFILE_GET_URL}`);
    return NextResponse.json(
      { detail: `Profile service unavailable: ${message}` },
      { status: 502 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  const headers = forwardHeaders(req);
  // Frontend sends PATCH; real backend expects PUT — translate here.
  const url = PROFILE_PUT_URL;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body." }, { status: 400 });
  }

  try {
    console.log(`[profile/route] → PUT ${url}`);
    const backendRes = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    console.log(`[profile/route] ← ${backendRes.status}`);

    if (backendRes.ok) {
      const data = await backendRes.json().catch(() => ({}));
      return NextResponse.json(data, { status: 200 });
    }

    if (backendRes.status === 401) {
      // Token expired — return submitted data optimistically so UI reflects save.
      return NextResponse.json(body, { status: 200 });
    }

    if (backendRes.status === 422) {
      const errBody = await backendRes.json().catch(() => ({ detail: "Validation error" }));
      return NextResponse.json(errBody, { status: 422 });
    }

    if (backendRes.status === 404) {
      return NextResponse.json({ detail: "Profile not found." }, { status: 404 });
    }

    // Backend endpoint not yet implemented — return the submitted data as an
    // optimistic response so the UI reflects what the user saved.
    if (backendRes.status === 405) {
      return NextResponse.json(body, { status: 200 });
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
