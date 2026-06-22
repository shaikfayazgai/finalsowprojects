/** Mock backend — escalations + metrics. */

import { NextResponse } from "next/server";
import { MOCK_ESCALATIONS, MOCK_ESCALATION_METRICS } from "@/mocks/mentor";

const SIMULATED_LATENCY_MS = 220;

export async function GET() {
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  const items = [...MOCK_ESCALATIONS].sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
  return NextResponse.json({ items, total: items.length, metrics: MOCK_ESCALATION_METRICS });
}
