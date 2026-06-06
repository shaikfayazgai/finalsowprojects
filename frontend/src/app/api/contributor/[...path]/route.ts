import { NextRequest, NextResponse } from "next/server";

/**
 * Catch-all proxy for the contributor portal → contributor-service (via Kong).
 * Next.js prefers more-specific route files over this catch-all, so existing
 * dedicated proxies (tasks, profile/*, earnings, …) still win; this only
 * handles contributor endpoints that lack their own route file (e.g. the
 * dashboard), forwarding GET/POST/PATCH/PUT/DELETE with the Bearer token.
 */
const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

function headers(req: NextRequest): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const a = req.headers.get("authorization");
  if (a) h.Authorization = a;
  return h;
}

async function forward(req: NextRequest, path: string[], method: string) {
  const sub = path.join("/");
  const qs = new URL(req.url).search;
  const url = `${BACKEND}/api/contributor/${sub}${qs}`;
  const body = method === "GET" || method === "DELETE" ? undefined : await req.text();
  try {
    const r = await fetch(url, { method, headers: headers(req), body, cache: "no-store", signal: AbortSignal.timeout(30000) });
    return NextResponse.json(await r.json().catch(() => ({})), { status: r.status });
  } catch {
    return NextResponse.json({ detail: "Request failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) { return forward(req, (await params).path, "GET"); }
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) { return forward(req, (await params).path, "POST"); }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) { return forward(req, (await params).path, "PATCH"); }
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) { return forward(req, (await params).path, "PUT"); }
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) { return forward(req, (await params).path, "DELETE"); }
