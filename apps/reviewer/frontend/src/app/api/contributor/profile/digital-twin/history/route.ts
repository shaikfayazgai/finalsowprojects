import { NextRequest, NextResponse } from "next/server";
import { mockDigitalTwin } from "@/mocks/data/contributor";

const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";
const VALID_PERIODS = new Set(["3m", "6m", "1y"]);

function forwardHeaders(req: NextRequest): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const auth = req.headers.get("authorization");
  if (auth) h.Authorization = auth;
  const contributorId = req.headers.get("x-contributor-id");
  if (contributorId) h["X-Contributor-Id"] = contributorId;
  return h;
}

function mockHistoryBody(period: string) {
  const count = period === "3m" ? 3 : period === "6m" ? 6 : mockDigitalTwin.monthlyActivity.length;
  return {
    period,
    snapshots: mockDigitalTwin.monthlyActivity.slice(-count),
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("period")?.trim() ?? "3m";
  const period = VALID_PERIODS.has(raw) ? raw : "3m";

  if (!BACKEND) {
    return NextResponse.json(mockHistoryBody(period));
  }

  const headers = forwardHeaders(req);
  const q = new URLSearchParams();
  q.set("period", period);
  const url = `${BACKEND}/api/contributor/profile/digital-twin/history?${q.toString()}`;

  try {
    const backendRes = await fetch(url, { method: "GET", headers, cache: "no-store" });
    if (backendRes.ok) {
      const data = await backendRes.json().catch(() => mockHistoryBody(period));
      return NextResponse.json(data, { status: 200 });
    }
    if (backendRes.status === 404) {
      return NextResponse.json({ detail: "Digital twin history not found.", ...mockHistoryBody(period) }, { status: 404 });
    }
    const errBody = await backendRes.json().catch(() => ({ detail: `Backend error ${backendRes.status}` }));
    return NextResponse.json(errBody, { status: backendRes.status });
  } catch {
    return NextResponse.json(mockHistoryBody(period));
  }
}
