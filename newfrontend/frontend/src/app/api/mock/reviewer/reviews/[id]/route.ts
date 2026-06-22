/** Mock backend — reviewer single review. */

import { NextResponse } from "next/server";
import { getReviewerItem } from "@/lib/mocks/reviewer-runtime-store";

const SIMULATED_LATENCY_MS = 240;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  const review = getReviewerItem(id);
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  if (review.state !== "open") {
    return NextResponse.json({ error: "Review already decided" }, { status: 410 });
  }
  return NextResponse.json({ review });
}
