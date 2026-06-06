import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

function authHeader(req: NextRequest): Record<string, string> {
  const token = req.headers.get("authorization") ?? "";
  return token ? { Authorization: token } : {};
}

/* ── GET /api/contributor/support/faqs ────────────────────────────────────── */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = new URLSearchParams();
  if (searchParams.get("category")) q.set("category", searchParams.get("category")!);
  if (searchParams.get("q"))        q.set("q",        searchParams.get("q")!);
  const qs = q.toString();

  const url = `${BACKEND}/api/contributor/support/faqs${qs ? `?${qs}` : ""}`;
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
