/** Mock backend — reviewer dashboard payload. */

import { NextResponse } from "next/server";
import { getReviewerOpenItems } from "@/lib/mocks/reviewer-runtime-store";

const SIMULATED_LATENCY_MS = 220;

export async function GET() {
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  const pending = getReviewerOpenItems();
  const slaRiskCount = pending.filter(
    (r) => r.slaTier === "warning" || r.slaTier === "critical" || r.slaTier === "breached",
  ).length;
  return NextResponse.json({
    pending,
    slaRiskCount,
    done7d: 12,
    avgTimeMin: 28,
  });
}
