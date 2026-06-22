/** Mock backend — mentor notifications. */

import { NextResponse } from "next/server";
import { MOCK_MENTOR_NOTIFICATIONS } from "@/mocks/mentor";

const SIMULATED_LATENCY_MS = 180;

export async function GET() {
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  return NextResponse.json({ items: MOCK_MENTOR_NOTIFICATIONS, total: MOCK_MENTOR_NOTIFICATIONS.length });
}
