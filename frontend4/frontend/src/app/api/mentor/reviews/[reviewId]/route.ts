import { NextRequest, NextResponse } from "next/server";
import { requireRequest } from "@/lib/api/request-context";
import {
  getRuntimeReview,
  recordReviewDecision,
  saveReviewDraft,
} from "@/lib/mentor/runtime-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ reviewId: string }> },
) {
  const auth = await requireRequest({ allowedRoles: ["mentor", "admin", "super_admin"] });
  if (auth instanceof NextResponse) return auth;

  const { reviewId } = await ctx.params;
  const review = getRuntimeReview(reviewId);
  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const kind = body.kind as string;
  if (!["accept", "rework", "reject", "withdrawn", "reassigned"].includes(kind)) {
    return NextResponse.json({ error: "Invalid decision kind" }, { status: 400 });
  }

  try {
    const decision = recordReviewDecision({
      reviewId,
      kind: kind as "accept" | "rework" | "reject" | "withdrawn" | "reassigned",
      reviewerConfidence: body.reviewerConfidence as "confident" | "comfortable" | "tentative" | undefined,
      finalComment: typeof body.finalComment === "string" ? body.finalComment : undefined,
      rejectReason: typeof body.rejectReason === "string" ? body.rejectReason : undefined,
      rejectCategory: body.rejectCategory as
        | "doesnt_meet_criteria"
        | "off_spec"
        | "quality_below"
        | "plagiarism"
        | "other"
        | undefined,
      reworkCorrections: Array.isArray(body.reworkCorrections)
        ? body.reworkCorrections.filter((c): c is string => typeof c === "string")
        : undefined,
      withdrawType: body.withdrawType as
        | "personal"
        | "prior_employment"
        | "financial"
        | "other"
        | undefined,
      rubricOverall: typeof body.rubricOverall === "number" ? body.rubricOverall : undefined,
    });
    return NextResponse.json({ success: true, decision });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not record decision." },
      { status: 400 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ reviewId: string }> },
) {
  const auth = await requireRequest({ allowedRoles: ["mentor"] });
  if (auth instanceof NextResponse) return auth;

  const { reviewId } = await ctx.params;
  if (!getRuntimeReview(reviewId)) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  saveReviewDraft(reviewId, {
    whatWorked: typeof body.whatWorked === "string" ? body.whatWorked : undefined,
    corrections: Array.isArray(body.corrections) ? (body.corrections as ReviewDraft["corrections"]) : undefined,
    suggestions: Array.isArray(body.suggestions)
      ? body.suggestions.filter((s): s is string => typeof s === "string")
      : undefined,
    coachingNote: typeof body.coachingNote === "string" ? body.coachingNote : undefined,
    rubric: body.rubric as Record<string, { stars: number; comment: string }> | undefined,
    savedAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, savedAt: new Date().toISOString() });
}

type ReviewDraft = import("@/lib/mentor/runtime-store").ReviewDraftPayload;
