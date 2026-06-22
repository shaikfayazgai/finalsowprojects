/**
 * POST /api/reviewer/reviews/[id]/decision — record a QA decision.
 *
 * The UI sends { decision: "accept" | "rework" | "reject", comment? }. The
 * backend models a decision as an assignment status update, so we map the
 * decision to a status and PATCH /api/v1/reviewer/assignments/{id}. On
 * accept/approved the backend also finalises the underlying submission + task.
 */
import { NextRequest, NextResponse } from "next/server";
import { reviewerBackendProxy } from "@/lib/api/reviewer-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DECISION_TO_STATUS: Record<string, string> = {
  accept: "approved",
  rework: "rework",
  reject: "rejected",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    decision?: string;
    comment?: string;
  };
  const decision = (body.decision ?? "").toLowerCase();
  const status = DECISION_TO_STATUS[decision];
  if (!status) {
    return NextResponse.json({ error: "Invalid decision." }, { status: 400 });
  }
  // Comment is mandatory for rework/reject (mirrors the mock + UI rule).
  if ((decision === "rework" || decision === "reject") && !body.comment) {
    return NextResponse.json(
      { error: "A comment is required for rework and reject decisions." },
      { status: 400 },
    );
  }

  return reviewerBackendProxy(`/api/v1/reviewer/assignments/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: {
      status,
      data: {
        comment: body.comment ?? null,
        reviewerNote: body.comment ?? null,
        decision,
      },
    },
  });
}
