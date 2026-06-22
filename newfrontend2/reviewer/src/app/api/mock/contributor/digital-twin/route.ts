/**
 * Mock backend — digital-twin summary (Phase 1 baseline).
 * Persona-aware so the demo can flip identity via ?persona=.
 */

import { NextResponse } from "next/server";
import { getMockTwin } from "@/mocks/contributor/digital-twin";
import { isPersona } from "@/mocks/contributor/personas";

const SIMULATED_LATENCY_MS = 200;

export async function GET(req: Request) {
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  const url = new URL(req.url);
  const raw = url.searchParams.get("persona");
  const persona = isPersona(raw) ? raw : "freelancer";
  return NextResponse.json({ twin: getMockTwin(persona) });
}
