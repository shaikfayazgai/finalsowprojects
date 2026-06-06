import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

function authHeader(req: NextRequest): Record<string, string> {
  const token = req.headers.get("authorization") ?? "";
  return token ? { Authorization: token } : {};
}

/* ── POST /api/contributor/credentials/[credentialId]/academic-portfolio ─── */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ credentialId: string }> },
) {
  const { credentialId } = await params;
  const headers = { "Content-Type": "application/json", ...authHeader(req) };
  const url = `${BACKEND}/api/contributor/credentials/${encodeURIComponent(credentialId)}/academic-portfolio`;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body." }, { status: 400 });
  }

  try {
    console.log(`[academic-portfolio/route] → POST ${url}`);
    const backendRes = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });
    console.log(`[academic-portfolio/route] ← ${backendRes.status}`);

    if (backendRes.ok) {
      const data = await backendRes.json().catch(() => ({}));
      return NextResponse.json(data, { status: 200 });
    }

    if (backendRes.status === 422) {
      const errBody = await backendRes.json().catch(() => ({ detail: "Validation error" }));
      return NextResponse.json(errBody, { status: 422 });
    }

    if (backendRes.status === 404) {
      return NextResponse.json({ detail: "Credential not found." }, { status: 404 });
    }

    const errBody = await backendRes.json().catch(() => ({
      detail: `Backend error ${backendRes.status}`,
    }));
    return NextResponse.json(errBody, { status: backendRes.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[academic-portfolio/route] ✗ connection error — ${message} | url: ${url}`);
    return NextResponse.json(
      { detail: `Academic portfolio service unavailable: ${message}` },
      { status: 502 },
    );
  }
}
