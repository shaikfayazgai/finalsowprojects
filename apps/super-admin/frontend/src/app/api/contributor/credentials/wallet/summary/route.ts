import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

function authHeader(req: NextRequest): Record<string, string> {
  const token = req.headers.get("authorization") ?? "";
  return token ? { Authorization: token } : {};
}

/* ── GET /api/contributor/credentials/wallet/summary ───────────────────────── */

export async function GET(req: NextRequest) {
  const headers = { "Content-Type": "application/json", ...authHeader(req) };
  const url = `${BACKEND}/api/contributor/credentials/wallet/summary`;

  try {
    const backendRes = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (backendRes.ok) {
      const data = await backendRes.json().catch(() => ({}));
      return NextResponse.json(data, { status: 200 });
    }

    const errBody = await backendRes.json().catch(() => ({
      detail: `Backend error ${backendRes.status}`,
    }));
    return NextResponse.json(errBody, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { detail: "Failed to reach credentials service." },
      { status: 502 },
    );
  }
}

/* ── POST /api/contributor/credentials/wallet/summary ──────────────────────── */

export async function POST(req: NextRequest) {
  const headers = { "Content-Type": "application/json", ...authHeader(req) };
  const url = `${BACKEND}/api/contributor/credentials/wallet/summary`;

  try {
    // Parse request body for custom data
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { detail: "Invalid request body. Expected JSON data." },
        { status: 400 },
      );
    }

    // Validate required fields
    if (!body.category) {
      return NextResponse.json(
        { detail: "Category field is required." },
        { status: 422 },
      );
    }

    const backendRes = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (backendRes.ok) {
      const data = await backendRes.json().catch(() => ({}));
      return NextResponse.json(data, { status: 201 });
    }

    const errBody = await backendRes.json().catch(() => ({
      detail: `Backend error ${backendRes.status}`,
    }));
    return NextResponse.json(errBody, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { detail: "Failed to reach credentials service." },
      { status: 502 },
    );
  }
}
