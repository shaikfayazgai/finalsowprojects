/** Mock backend — full reviewer queue. */

import { NextResponse } from "next/server";
import { getReviewerOpenItems } from "@/lib/mocks/reviewer-runtime-store";

const SIMULATED_LATENCY_MS = 220;

export async function GET() {
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  const items = getReviewerOpenItems();
  return NextResponse.json({ items, total: items.length });
}
