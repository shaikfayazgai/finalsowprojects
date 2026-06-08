/**
 * Mock backend — single safety case with timeline.
 */

import { NextResponse } from "next/server";
import { MOCK_SAFETY_CASES } from "@/mocks/contributor/support";

const SIMULATED_LATENCY_MS = 220;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  const safetyCase = MOCK_SAFETY_CASES.find((c) => c.id === id);
  if (!safetyCase) {
    return NextResponse.json({ error: "Safety case not found" }, { status: 404 });
  }
  return NextResponse.json({ safetyCase });
}
