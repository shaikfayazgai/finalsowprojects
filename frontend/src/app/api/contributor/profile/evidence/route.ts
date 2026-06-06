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

/* ── GET /api/contributor/profile/evidence ────────────────────────────────
 * Query: q (search), type, skill
 */

export async function GET(req: NextRequest) {
  const headers = forwardHeaders(req);
  const { searchParams } = new URL(req.url);
  const q = new URLSearchParams();
  if (searchParams.get("q"))       q.set("q", searchParams.get("q")!);
  if (searchParams.get("type"))   q.set("type", searchParams.get("type")!);
  if (searchParams.get("skill"))  q.set("skill", searchParams.get("skill")!);
  const qs = q.toString();
  const url = `${BACKEND}/api/contributor/profile/evidence${qs ? `?${qs}` : ""}`;

  try {
    console.log(`[profile/evidence/route] → GET ${url}`);
    const backendRes = await fetch(url, { method: "GET", headers, cache: "no-store" });
    console.log(`[profile/evidence/route] ← ${backendRes.status}`);

    if (backendRes.ok) {
      const data = await backendRes.json().catch(() => ({ items: [], total: 0 }));
      return NextResponse.json(data, { status: 200 });
    }

    if (backendRes.status === 422) {
      const body = await backendRes.json().catch(() => ({ detail: "Validation error" }));
      return NextResponse.json(body, { status: 422 });
    }

    if (backendRes.status === 404) {
      return NextResponse.json({ detail: "Evidence not found.", items: [], total: 0 }, { status: 404 });
    }

    const errBody = await backendRes.json().catch(() => ({
      detail: `Backend error ${backendRes.status}`,
    }));
    return NextResponse.json(errBody, { status: backendRes.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[profile/evidence/route] ✗ connection error — ${message} | url: ${url}`);
    return NextResponse.json(
      { detail: `Evidence service unavailable: ${message}` },
      { status: 502 },
    );
  }
}

/* ── POST /api/contributor/profile/evidence (Create Evidence) ───────────────
 * 201 Created — body per OpenAPI; forwards X-Contributor-Id
 */

export async function POST(req: NextRequest) {
  const headers = forwardHeaders(req);
  const url = `${BACKEND}/api/contributor/profile/evidence`;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body." }, { status: 400 });
  }

  try {
    console.log(`[profile/evidence/route] → POST ${url}`);
    const backendRes = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });
    console.log(`[profile/evidence/route] ← ${backendRes.status}`);

    if (backendRes.status === 201 || backendRes.status === 200) {
      const data = await backendRes.json().catch(() => ({}));
      return NextResponse.json(data, { status: backendRes.status });
    }

    if (backendRes.status === 422) {
      const errBody = await backendRes.json().catch(() => ({ detail: "Validation error" }));
      return NextResponse.json(errBody, { status: 422 });
    }

    const errBody = await backendRes.json().catch(() => ({
      detail: `Backend error ${backendRes.status}`,
    }));
    return NextResponse.json(errBody, { status: backendRes.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[profile/evidence/route] ✗ connection error (POST) — ${message} | url: ${url}`);
    return NextResponse.json(
      { detail: `Evidence service unavailable: ${message}` },
      { status: 502 },
    );
  }
}
