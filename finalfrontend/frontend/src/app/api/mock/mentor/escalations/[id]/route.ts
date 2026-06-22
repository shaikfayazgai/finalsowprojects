/** Mock backend — single escalation. */

import { NextResponse } from "next/server";
import { getMockEscalation } from "@/mocks/mentor";

const SIMULATED_LATENCY_MS = 220;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  const escalation = getMockEscalation(id);
  if (!escalation) return NextResponse.json({ error: "Escalation not found" }, { status: 404 });
  return NextResponse.json({ escalation });
}
