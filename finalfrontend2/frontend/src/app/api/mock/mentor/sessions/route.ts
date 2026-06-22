/** Mock backend — mentorship sessions list. */

import { NextResponse } from "next/server";
import { MOCK_SESSIONS } from "@/mocks/mentor";

const SIMULATED_LATENCY_MS = 220;

export async function GET() {
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  return NextResponse.json({ items: MOCK_SESSIONS, total: MOCK_SESSIONS.length });
}
