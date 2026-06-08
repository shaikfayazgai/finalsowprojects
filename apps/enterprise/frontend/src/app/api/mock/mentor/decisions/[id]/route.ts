/** Mock backend — single past decision. */

import { NextResponse } from "next/server";
import { getRuntimeDecision } from "@/lib/mentor/runtime-store";

const SIMULATED_LATENCY_MS = 200;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  const decision = getRuntimeDecision(id);
  if (!decision) return NextResponse.json({ error: "Decision not found" }, { status: 404 });
  return NextResponse.json({ decision });
}
