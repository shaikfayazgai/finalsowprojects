/**
 *   POST /api/mentor/reviews/:reviewId  → record a mentor decision
 *   PUT  /api/mentor/reviews/:reviewId  → save review draft (no backend, safe 200 stub)
 *
 *   POST proxied to mentor backend :8101  /api/v1/mentor/submissions/{reviewId}/decide
 *   PUT  returns 200 stub (draft-save; backend endpoint does not exist yet)
 */

import { NextRequest, NextResponse } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  const { reviewId } = await params;
  return proxyToBackendService(
    req,
    `/api/v1/mentor/submissions/${encodeURIComponent(reviewId)}/decide`,
  );
}

export async function PUT(
  _req: NextRequest,
  _ctx: { params: Promise<{ reviewId: string }> },
) {
  // Draft-save has no backend endpoint. Return a safe success stub so the UI
  // does not 500. Drafts are transient (session-only) until a decide endpoint
  // is built on the backend.
  return NextResponse.json({ success: true, savedAt: new Date().toISOString() });
}
