/** Mock backend — record a QA reviewer decision. */

import { NextResponse } from "next/server";
import { submitReviewerDecision } from "@/lib/mocks/reviewer-runtime-store";
import type { ReviewerDecisionKind } from "@/mocks/reviewer";

const SIMULATED_LATENCY_MS = 320;

const VALID: ReviewerDecisionKind[] = ["accept", "rework", "reject"];

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  let body: { decision?: string; comment?: string };
  try {
    body = (await req.json()) as { decision?: string; comment?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const decision = body.decision as ReviewerDecisionKind | undefined;
  if (!decision || !VALID.includes(decision)) {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  }

  if ((decision === "rework" || decision === "reject") && !body.comment?.trim()) {
    return NextResponse.json(
      { error: "Comment is required for rework and reject decisions" },
      { status: 400 },
    );
  }

  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));

  try {
    const record = submitReviewerDecision(id, decision, body.comment);
    return NextResponse.json({ decision: record });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not record decision";
    const status = msg.includes("not found") ? 404 : 409;
    return NextResponse.json({ error: msg }, { status });
  }
}
