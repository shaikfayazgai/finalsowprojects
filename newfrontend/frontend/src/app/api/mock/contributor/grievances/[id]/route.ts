/**
 * Mock backend — single grievance with timeline.
 */

import { NextResponse } from "next/server";
import { MOCK_GRIEVANCES } from "@/mocks/contributor/support";

const SIMULATED_LATENCY_MS = 220;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  const grievance = MOCK_GRIEVANCES.find((g) => g.id === id);
  if (!grievance) {
    return NextResponse.json({ error: "Grievance not found" }, { status: 404 });
  }
  return NextResponse.json({ grievance });
}
