/** Mock backend — single mentorship session. */

import { NextResponse } from "next/server";
import { getMockSession } from "@/mocks/mentor";

const SIMULATED_LATENCY_MS = 220;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  const session = getMockSession(id);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  return NextResponse.json({ session });
}
