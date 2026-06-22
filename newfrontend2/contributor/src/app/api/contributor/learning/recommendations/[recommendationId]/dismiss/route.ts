import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

function authHeader(req: NextRequest): Record<string, string> {
  const token = req.headers.get("authorization") ?? "";
  return token ? { Authorization: token } : {};
}

/* ── POST /api/contributor/learning/recommendations/[recommendationId]/dismiss */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ recommendationId: string }> },
) {
  const { recommendationId } = await params;
  const headers = { "Content-Type": "application/json", ...authHeader(req) };
  const url = `${BACKEND}/api/contributor/learning/recommendations/${encodeURIComponent(recommendationId)}/dismiss`;

  const backendRes = await fetch(url, { method: "POST", headers });

  if (backendRes.ok) {
    const data = await backendRes.json().catch(() => ({
      recommendation_id: recommendationId,
      dismissed: true,
    }));
    return NextResponse.json(data, { status: 200 });
  }

  const errBody = await backendRes.json().catch(() => ({
    detail: `Backend error ${backendRes.status}`,
  }));
  return NextResponse.json(errBody, { status: backendRes.status });
}
