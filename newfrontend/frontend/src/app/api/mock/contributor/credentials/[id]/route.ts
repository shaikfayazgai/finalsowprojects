/**
 * Mock backend — single credential by id.
 */

import { NextResponse } from "next/server";
import { getMockCredential } from "@/mocks/contributor/credentials";

const SIMULATED_LATENCY_MS = 220;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  const credential = getMockCredential(id);
  if (!credential) {
    return NextResponse.json({ error: "Credential not found" }, { status: 404 });
  }
  return NextResponse.json({ credential });
}
