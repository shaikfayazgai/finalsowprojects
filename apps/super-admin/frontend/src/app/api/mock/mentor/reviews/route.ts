/** Mock backend — mentor review queue (open assignments). */

import { NextResponse } from "next/server";
import { listOpenReviews } from "@/lib/mentor/runtime-store";

const SIMULATED_LATENCY_MS = 220;

export async function GET() {
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  const items = listOpenReviews();
  return NextResponse.json({ items, total: items.length });
}
