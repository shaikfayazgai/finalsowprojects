import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

function authHeader(req: NextRequest): Record<string, string> {
  const token = req.headers.get("authorization") ?? "";
  return token ? { Authorization: token } : {};
}

/* ── GET /api/contributor/credentials/[credentialId]/certificate ────────────── */
/*
 * Query params:
 *   format  string   Export format — default "pdf"
 *
 * Handles three possible backend responses:
 *   1. JSON-encoded string   →  URL or base64, forwarded as JSON
 *   2. Binary PDF / octet    →  streamed back with correct Content-Type + disposition
 *   3. Plain text URL        →  wrapped in JSON string
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ credentialId: string }> },
) {
  const { credentialId } = await params;
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "pdf";

  const headers = { ...authHeader(req) };
  const url = `${BACKEND}/api/contributor/credentials/${encodeURIComponent(credentialId)}/certificate?format=${encodeURIComponent(format)}`;

  try {
    console.log(`[certificate/route] → ${url}`);
    const backendRes = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    console.log(`[certificate/route] ← ${backendRes.status} ${backendRes.headers.get("content-type") ?? ""}`);

    if (backendRes.ok) {
      const contentType = backendRes.headers.get("content-type") ?? "";

      /* Binary PDF or file — stream back with download headers */
      if (
        contentType.includes("application/pdf") ||
        contentType.includes("octet-stream")
      ) {
        const buffer = await backendRes.arrayBuffer();
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": contentType || "application/pdf",
            "Content-Disposition": `attachment; filename="credential-${credentialId}.pdf"`,
          },
        });
      }

      /* JSON response (string URL or base64) */
      if (contentType.includes("application/json")) {
        const data = await backendRes.json().catch(() => "");
        return NextResponse.json(data, { status: 200 });
      }

      /* Plain text (raw URL or other) */
      const text = await backendRes.text().catch(() => "");
      return NextResponse.json(text, { status: 200 });
    }

    if (backendRes.status === 422) {
      const body = await backendRes.json().catch(() => ({ detail: "Validation error" }));
      return NextResponse.json(body, { status: 422 });
    }

    if (backendRes.status === 404) {
      return NextResponse.json({ detail: "Certificate not found." }, { status: 404 });
    }

    const errBody = await backendRes.json().catch(() => ({
      detail: `Backend error ${backendRes.status}`,
    }));
    return NextResponse.json(errBody, { status: backendRes.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[certificate/route] ✗ connection error — ${message} | url: ${url}`);
    return NextResponse.json(
      { detail: `Certificate service unavailable: ${message}` },
      { status: 502 },
    );
  }
}
