/**
 * Mock backend — payout methods (bank/UPI/wallet) for the earnings flow.
 */

import { NextResponse } from "next/server";
import { MOCK_PAYOUT_METHODS } from "@/mocks/contributor/payouts";

const SIMULATED_LATENCY_MS = 220;

export async function GET() {
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  return NextResponse.json({
    items: MOCK_PAYOUT_METHODS,
    total: MOCK_PAYOUT_METHODS.length,
  });
}
