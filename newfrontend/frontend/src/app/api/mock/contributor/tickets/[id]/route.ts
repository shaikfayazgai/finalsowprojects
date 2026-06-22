/**
 * Mock backend — single ticket with full thread.
 */

import { NextResponse } from "next/server";
import { MOCK_TICKETS } from "@/mocks/contributor/support";

const SIMULATED_LATENCY_MS = 220;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  const ticket = MOCK_TICKETS.find((t) => t.id === id);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  return NextResponse.json({ ticket });
}
