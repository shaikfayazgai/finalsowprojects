import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

function authHeaders(req: NextRequest): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const auth = req.headers.get("authorization");
  if (auth) h.Authorization = auth;
  return h;
}

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`${BACKEND}/api/contributor/profile/completion`, {
      method: "GET",
      headers: authHeaders(req),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Completion lookup failed" }, { status: 500 });
  }
}
