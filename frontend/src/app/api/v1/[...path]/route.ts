import { NextRequest, NextResponse } from "next/server";

/**
 * Generic proxy for direct /api/v1/* calls from client components → backend
 * (via Kong). Forwards the Bearer token. Used by billing/review and any other
 * client that calls apiCall("/api/v1/..."). NextAuth's own /api/auth/* is a
 * separate route and not affected.
 */
const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

function headers(req: NextRequest): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const a = req.headers.get("authorization");
  if (a) h.Authorization = a;
  return h;
}

async function forward(req: NextRequest, path: string[], method: string) {
  const qs = new URL(req.url).search;
  const url = `${BACKEND}/api/v1/${path.join("/")}${qs}`;
  const body = method === "GET" || method === "DELETE" ? undefined : await req.text();
  try {
    const r = await fetch(url, { method, headers: headers(req), body, cache: "no-store", signal: AbortSignal.timeout(30000) });
    const text = await r.text();
    try { return NextResponse.json(JSON.parse(text), { status: r.status }); }
    catch { return new NextResponse(text, { status: r.status }); }
  } catch {
    return NextResponse.json({ detail: "Request failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) { return forward(req, (await params).path, "GET"); }
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) { return forward(req, (await params).path, "POST"); }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) { return forward(req, (await params).path, "PATCH"); }
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) { return forward(req, (await params).path, "PUT"); }
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) { return forward(req, (await params).path, "DELETE"); }
