/** Mock backend — reviewer past decisions + metrics. */

import { NextResponse } from "next/server";
import { MOCK_REVIEWER_METRICS } from "@/mocks/reviewer";
import { getReviewerDecisions } from "@/lib/mocks/reviewer-runtime-store";

const SIMULATED_LATENCY_MS = 220;

export async function GET() {
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  const items = getReviewerDecisions();
  return NextResponse.json({ items, total: items.length, metrics: MOCK_REVIEWER_METRICS });
}
