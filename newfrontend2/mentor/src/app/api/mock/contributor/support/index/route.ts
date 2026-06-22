/**
 * Mock backend — combined Support index payload: FAQ groups, recent
 * tickets, and open safety cases. One round-trip for the landing page.
 */

import { NextResponse } from "next/server";
import { MOCK_FAQS, MOCK_GRIEVANCES, MOCK_SAFETY_CASES, MOCK_TICKETS } from "@/mocks/contributor/support";

const SIMULATED_LATENCY_MS = 220;

export async function GET() {
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  return NextResponse.json({
    faqs: MOCK_FAQS,
    tickets: MOCK_TICKETS,
    safetyCases: MOCK_SAFETY_CASES,
    grievances: MOCK_GRIEVANCES,
  });
}
