/**
 * Mock backend — list of issued credentials for the signed-in contributor.
 *
 * Returns MOCK_CREDENTIALS as JSON with a small artificial delay so the
 * UI exercises real loading skeletons. Wire-compatible with the eventual
 * Glimmora backend response shape (`{ items, total }`).
 */

import { NextResponse } from "next/server";
import { MOCK_CREDENTIALS } from "@/mocks/contributor/credentials";

const SIMULATED_LATENCY_MS = 220;

export async function GET() {
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  return NextResponse.json({
    items: MOCK_CREDENTIALS,
    total: MOCK_CREDENTIALS.length,
  });
}
