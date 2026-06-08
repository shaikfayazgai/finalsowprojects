/**
 * Mock backend — active contributor profile. Reads ?persona= so the
 * demo can flip between internal / freelancer / student / women without
 * a real auth context. When the real backend wires up, this will read
 * the session and ignore the query param.
 */

import { NextResponse } from "next/server";
import { MOCK_PROFILES, isPersona } from "@/mocks/contributor/personas";

const SIMULATED_LATENCY_MS = 180;

export async function GET(req: Request) {
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  const url = new URL(req.url);
  const raw = url.searchParams.get("persona");
  const persona = isPersona(raw) ? raw : "freelancer";
  return NextResponse.json({ profile: MOCK_PROFILES[persona] });
}
