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

function listParams(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  return {
    q: searchParams.get("q") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    skill: searchParams.get("skill") ?? undefined,
  };
}

/* ── GET /api/contributor/profile/evidence ──────────────────────────────── */

export async function GET(req: NextRequest) {
  const params = listParams(req);

  if (!BACKEND) {
    const { listMockProfileEvidence } = await import("@/lib/contributor/profile-evidence-mock");
    return NextResponse.json(listMockProfileEvidence(params));
  }

  const headers = forwardHeaders(req);
  const q = new URLSearchParams();
  if (params.q) q.set("q", params.q);
  if (params.type) q.set("type", params.type);
  if (params.skill) q.set("skill", params.skill);
  const qs = q.toString();
  const url = `${BACKEND}/api/contributor/profile/evidence${qs ? `?${qs}` : ""}`;

  try {
    const backendRes = await fetch(url, { method: "GET", headers, cache: "no-store" });
    if (backendRes.ok) {
      const data = await backendRes.json().catch(() => ({ items: [], total: 0 }));
      return NextResponse.json(data, { status: 200 });
    }
    if (backendRes.status === 404) {
      return NextResponse.json({ detail: "Evidence not found.", items: [], total: 0 }, { status: 404 });
    }
    const errBody = await backendRes.json().catch(() => ({ detail: `Backend error ${backendRes.status}` }));
    return NextResponse.json(errBody, { status: backendRes.status });
  } catch {
    const { listMockProfileEvidence } = await import("@/lib/contributor/profile-evidence-mock");
    return NextResponse.json(listMockProfileEvidence(params));
  }
}

/* ── POST /api/contributor/profile/evidence ─────────────────────────────── */

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body." }, { status: 400 });
  }

  if (!BACKEND) {
    const { createMockProfileEvidence } = await import("@/lib/contributor/profile-evidence-mock");
    const item = createMockProfileEvidence(body as Parameters<typeof createMockProfileEvidence>[0]);
    return NextResponse.json(item, { status: 201 });
  }

  const headers = forwardHeaders(req);
  const url = `${BACKEND}/api/contributor/profile/evidence`;

  try {
    const backendRes = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (backendRes.status === 201 || backendRes.status === 200) {
      const data = await backendRes.json().catch(() => ({}));
      return NextResponse.json(data, { status: backendRes.status });
    }
    const errBody = await backendRes.json().catch(() => ({ detail: `Backend error ${backendRes.status}` }));
    return NextResponse.json(errBody, { status: backendRes.status });
  } catch {
    const { createMockProfileEvidence } = await import("@/lib/contributor/profile-evidence-mock");
    const item = createMockProfileEvidence(body as Parameters<typeof createMockProfileEvidence>[0]);
    return NextResponse.json(item, { status: 201 });
  }
}
