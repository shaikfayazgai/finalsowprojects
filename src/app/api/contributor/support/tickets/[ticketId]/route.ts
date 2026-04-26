import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

function authHeader(req: NextRequest): Record<string, string> {
  const token = req.headers.get("authorization") ?? "";
  return token ? { Authorization: token } : {};
}

/* ── GET /api/contributor/support/tickets/[ticketId] ──────────────────────── */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  const { ticketId } = await params;
  const url = `${BACKEND}/api/contributor/support/tickets/${encodeURIComponent(ticketId)}`;
  const headers = { "Content-Type": "application/json", ...authHeader(req) };

  const backendRes = await fetch(url, { method: "GET", headers, cache: "no-store" });

  if (backendRes.ok) {
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: 200 });
  }

  if (backendRes.status === 404) {
    return NextResponse.json({ detail: "Ticket not found." }, { status: 404 });
  }

  const errBody = await backendRes.json().catch(() => ({
    detail: `Backend error ${backendRes.status}`,
  }));
  return NextResponse.json(errBody, { status: backendRes.status });
}
