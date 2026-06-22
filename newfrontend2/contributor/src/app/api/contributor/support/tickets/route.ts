import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

function authHeader(req: NextRequest): Record<string, string> {
  const token = req.headers.get("authorization") ?? "";
  return token ? { Authorization: token } : {};
}

/* ── GET /api/contributor/support/tickets ─────────────────────────────────── */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = new URLSearchParams();
  if (searchParams.get("status"))    q.set("status",    searchParams.get("status")!);
  if (searchParams.get("priority"))  q.set("priority",  searchParams.get("priority")!);
  if (searchParams.get("category"))  q.set("category",  searchParams.get("category")!);
  if (searchParams.get("page"))      q.set("page",      searchParams.get("page")!);
  if (searchParams.get("page_size")) q.set("page_size", searchParams.get("page_size")!);
  const qs = q.toString();

  const url = `${BACKEND}/api/contributor/support/tickets${qs ? `?${qs}` : ""}`;
  const headers = { "Content-Type": "application/json", ...authHeader(req) };

  const backendRes = await fetch(url, { method: "GET", headers, cache: "no-store" });

  if (backendRes.ok) {
    const data = await backendRes.json().catch(() => ({ items: [], page: 1, page_size: 20, total: 0 }));
    return NextResponse.json(data, { status: 200 });
  }

  const errBody = await backendRes.json().catch(() => ({
    detail: `Backend error ${backendRes.status}`,
  }));
  return NextResponse.json(errBody, { status: backendRes.status });
}

/* ── POST /api/contributor/support/tickets ────────────────────────────────── */

export async function POST(req: NextRequest) {
  const url = `${BACKEND}/api/contributor/support/tickets`;
  const headers = { "Content-Type": "application/json", ...authHeader(req) };
  const body = await req.text();

  const backendRes = await fetch(url, { method: "POST", headers, body });

  /* 201 Created → forward with 201 */
  if (backendRes.ok) {
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  }

  const errBody = await backendRes.json().catch(() => ({
    detail: `Backend error ${backendRes.status}`,
  }));
  return NextResponse.json(errBody, { status: backendRes.status });
}
