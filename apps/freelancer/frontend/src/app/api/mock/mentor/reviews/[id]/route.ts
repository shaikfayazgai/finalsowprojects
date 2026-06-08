/**
 * Mock backend — single review with contributor's last decisions attached.
 */

import { NextResponse } from "next/server";
import { getRuntimeReview, getReviewDraft } from "@/lib/mentor/runtime-store";
import { MOCK_CONTRIBUTOR_DECISIONS } from "@/mocks/mentor";

const SIMULATED_LATENCY_MS = 240;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  const review = getRuntimeReview(id);
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  const contributorDecisions = MOCK_CONTRIBUTOR_DECISIONS[review.contributorId] ?? [];
  const draft = getReviewDraft(id);
  return NextResponse.json({ review, contributorDecisions, draft });
}
