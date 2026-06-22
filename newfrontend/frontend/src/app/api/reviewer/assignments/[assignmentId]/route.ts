/**
 * PATCH /api/reviewer/assignments/:assignmentId — record the reviewer's decision
 * (claim + approve/rework/reject). On approval the backend marks the underlying
 * submission/task complete and creates the contributor's eligible payout.
 * Proxies to the reviewer backend (8105); JWT injected.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  return proxyToBackendService(req, `/api/v1/reviewer/assignments/${encodeURIComponent(assignmentId)}`);
}
