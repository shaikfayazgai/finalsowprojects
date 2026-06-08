/** Mock backend — past decisions list + metrics rollup. */

import { NextResponse } from "next/server";
import { listAllDecisions } from "@/lib/mentor/runtime-store";
import { MOCK_MENTOR_METRICS } from "@/mocks/mentor";

const SIMULATED_LATENCY_MS = 200;

export async function GET() {
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  const items = listAllDecisions();
  return NextResponse.json({ items, total: items.length, metrics: MOCK_MENTOR_METRICS });
}
