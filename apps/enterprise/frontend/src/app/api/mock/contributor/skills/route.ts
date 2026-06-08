/**
 * Mock backend — declared skills for the contributor.
 */

import { NextResponse } from "next/server";
import { MOCK_SKILLS } from "@/mocks/contributor/digital-twin";

const SIMULATED_LATENCY_MS = 200;

export async function GET() {
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  return NextResponse.json({ items: MOCK_SKILLS, total: MOCK_SKILLS.length });
}
