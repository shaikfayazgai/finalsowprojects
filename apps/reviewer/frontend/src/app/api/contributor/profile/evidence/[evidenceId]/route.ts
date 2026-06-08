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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ evidenceId: string }> },
) {
  const { evidenceId } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body." }, { status: 400 });
  }

  if (!BACKEND) {
    const { updateMockProfileEvidence } = await import("@/lib/contributor/profile-evidence-mock");
    const item = updateMockProfileEvidence(
      evidenceId,
      body as Parameters<typeof updateMockProfileEvidence>[1],
    );
    if (!item) return NextResponse.json({ detail: "Evidence not found." }, { status: 404 });
    return NextResponse.json(item, { status: 200 });
  }

  const headers = forwardHeaders(req);
  const url = `${BACKEND}/api/contributor/profile/evidence/${encodeURIComponent(evidenceId)}`;

  try {
    const backendRes = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (backendRes.status === 200 || backendRes.status === 201) {
      const data = await backendRes.json().catch(() => ({}));
      return NextResponse.json(data, { status: backendRes.status });
    }
    const errBody = await backendRes.json().catch(() => ({ detail: `Backend error ${backendRes.status}` }));
    return NextResponse.json(errBody, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { detail: "Unable to reach the evidence service." },
      { status: 502 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ evidenceId: string }> },
) {
  const { evidenceId } = await params;

  if (!BACKEND) {
    const { deleteMockProfileEvidence } = await import("@/lib/contributor/profile-evidence-mock");
    const ok = deleteMockProfileEvidence(evidenceId);
    if (!ok) return NextResponse.json({ detail: "Evidence not found." }, { status: 404 });
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const headers = forwardHeaders(_req);
  const url = `${BACKEND}/api/contributor/profile/evidence/${encodeURIComponent(evidenceId)}`;

  try {
    const backendRes = await fetch(url, { method: "DELETE", headers, cache: "no-store" });
    if (backendRes.status === 200) {
      const text = await backendRes.text();
      if (!text) return NextResponse.json({ ok: true }, { status: 200 });
      try {
        return NextResponse.json(JSON.parse(text) as unknown, { status: 200 });
      } catch {
        return NextResponse.json({ message: text }, { status: 200 });
      }
    }
    const errBody = await backendRes.json().catch(() => ({ detail: `Backend error ${backendRes.status}` }));
    return NextResponse.json(errBody, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { detail: "Unable to reach the evidence service." },
      { status: 502 },
    );
  }
}
