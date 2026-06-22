import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

function authHeader(req: NextRequest): Record<string, string> {
  const token = req.headers.get("authorization") ?? "";
  return token ? { Authorization: token } : {};
}

/* ── GET /api/contributor/credentials/[credentialId]/verification ───────────── */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ credentialId: string }> },
) {
  const { credentialId } = await params;
  const headers = { "Content-Type": "application/json", ...authHeader(req) };
  const url = `${BACKEND}/api/contributor/credentials/${encodeURIComponent(credentialId)}/verification`;

  try {
    console.log(`[verification/route] → ${url}`);
    const backendRes = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    console.log(`[verification/route] ← ${backendRes.status}`);

    if (backendRes.ok) {
      const data = await backendRes.json().catch(() => ({}));
      return NextResponse.json(data, { status: 200 });
    }

    /* 422 validation error — forward as-is */
    if (backendRes.status === 422) {
      const body = await backendRes.json().catch(() => ({ detail: "Validation error" }));
      return NextResponse.json(body, { status: 422 });
    }

    if (backendRes.status === 404) {
      return NextResponse.json({ detail: "Verification record not found." }, { status: 404 });
    }

    const errBody = await backendRes.json().catch(() => ({
      detail: `Backend error ${backendRes.status}`,
    }));
    return NextResponse.json(errBody, { status: backendRes.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[verification/route] ✗ connection error — ${message} | url: ${url}`);
    return NextResponse.json(
      { detail: `Verification service unavailable: ${message}` },
      { status: 502 },
    );
  }
}
