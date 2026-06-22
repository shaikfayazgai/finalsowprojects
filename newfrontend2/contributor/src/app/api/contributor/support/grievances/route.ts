import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

function authHeader(req: NextRequest): Record<string, string> {
  const token = req.headers.get("authorization") ?? "";
  return token ? { Authorization: token } : {};
}

/* ── GET /api/contributor/support/grievances ──────────────────────────────── */

export async function GET(req: NextRequest) {
  const url = `${BACKEND}/api/contributor/support/grievances`;
  const headers = { "Content-Type": "application/json", ...authHeader(req) };

  const backendRes = await fetch(url, { method: "GET", headers, cache: "no-store" });

  if (backendRes.ok) {
    const data = await backendRes.json().catch(() => ({ items: [], total: 0 }));
    return NextResponse.json(data, { status: 200 });
  }

  const errBody = await backendRes.json().catch(() => ({
    detail: `Backend error ${backendRes.status}`,
  }));
  return NextResponse.json(errBody, { status: backendRes.status });
}

/* ── POST /api/contributor/support/grievances ─────────────────────────────── */

export async function POST(req: NextRequest) {
  const url = `${BACKEND}/api/contributor/support/grievances`;
  const headers = { "Content-Type": "application/json", ...authHeader(req) };
  const body = await req.text();

  const backendRes = await fetch(url, { method: "POST", headers, body });

  /* 201 Created → forward */
  if (backendRes.ok) {
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  }

  const errBody = await backendRes.json().catch(() => ({
    detail: `Backend error ${backendRes.status}`,
  }));
  return NextResponse.json(errBody, { status: backendRes.status });
}
