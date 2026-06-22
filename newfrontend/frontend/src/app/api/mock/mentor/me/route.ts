/** Mock backend — active mentor identity. */

import { NextResponse } from "next/server";
import { MOCK_MENTORS, isMentorRole } from "@/mocks/mentor/personas";

const SIMULATED_LATENCY_MS = 180;

export async function GET(req: Request) {
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  const url = new URL(req.url);
  const raw = url.searchParams.get("role");
  const role = isMentorRole(raw) ? raw : "mentor.senior";
  return NextResponse.json({ profile: MOCK_MENTORS[role] });
}
