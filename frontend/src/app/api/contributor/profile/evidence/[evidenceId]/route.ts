import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

function forwardHeaders(req: NextRequest): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const auth = req.headers.get("authorization");
  if (auth) h.Authorization = auth;
  const contributorId = req.headers.get("x-contributor-id");
  if (contributorId) h["X-Contributor-Id"] = contributorId;
  return h;
}

/* ── PATCH /api/contributor/profile/evidence/{evidence_id} (Patch Evidence) */

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ evidenceId: string }> },
) {
  const { evidenceId } = await params;
  const headers = forwardHeaders(req);
  const url = `${BACKEND}/api/contributor/profile/evidence/${encodeURIComponent(evidenceId)}`;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body." }, { status: 400 });
  }

  try {
    console.log(`[profile/evidence/${evidenceId}/route] → PATCH ${url}`);
    const backendRes = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });
    console.log(`[profile/evidence/${evidenceId}/route] ← ${backendRes.status}`);

    if (backendRes.status === 200 || backendRes.status === 201) {
      const data = await backendRes.json().catch(() => ({}));
      return NextResponse.json(data, { status: backendRes.status });
    }

    if (backendRes.status === 422) {
      const errBody = await backendRes.json().catch(() => ({ detail: "Validation error" }));
      return NextResponse.json(errBody, { status: 422 });
    }

    const errBody = await backendRes.json().catch(() => ({
      detail: `Backend error ${backendRes.status}`,
    }));
    return NextResponse.json(errBody, { status: backendRes.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[profile/evidence/.../route] ✗ connection error (PATCH) — ${message} | url: ${url}`,
    );
    return NextResponse.json(
      { detail: `Evidence service unavailable: ${message}` },
      { status: 502 },
    );
  }
}

/* ── DELETE /api/contributor/profile/evidence/{evidence_id} (Delete Evidence) */

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ evidenceId: string }> },
) {
  const { evidenceId } = await params;
  const headers = forwardHeaders(_req);
  const url = `${BACKEND}/api/contributor/profile/evidence/${encodeURIComponent(evidenceId)}`;

  try {
    console.log(`[profile/evidence/${evidenceId}/route] → DELETE ${url}`);
    const backendRes = await fetch(url, { method: "DELETE", headers, cache: "no-store" });
    console.log(`[profile/evidence/${evidenceId}/route] ← ${backendRes.status}`);

    if (backendRes.status === 200) {
      const text = await backendRes.text();
      if (!text) {
        return NextResponse.json({ ok: true }, { status: 200 });
      }
      try {
        const data = JSON.parse(text) as unknown;
        return NextResponse.json(data, { status: 200 });
      } catch {
        return NextResponse.json({ message: text }, { status: 200 });
      }
    }

    if (backendRes.status === 422) {
      const errBody = await backendRes.json().catch(() => ({ detail: "Validation error" }));
      return NextResponse.json(errBody, { status: 422 });
    }

    const errBody = await backendRes.json().catch(() => ({
      detail: `Backend error ${backendRes.status}`,
    }));
    return NextResponse.json(errBody, { status: backendRes.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[profile/evidence/.../route] ✗ connection error (DELETE) — ${message} | url: ${url}`,
    );
    return NextResponse.json(
      { detail: `Evidence service unavailable: ${message}` },
      { status: 502 },
    );
  }
}
