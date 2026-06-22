/**
 * GET /api/decomposition/plans/{planId}/tasks/{taskId}/interests
 * Contributors who expressed interest in this task (enriched: matched skills,
 * rating, completed count) for the enterprise "Source" picker.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string; taskId: string }> },
) {
  const { planId, taskId } = await params;
  return proxyToBackendService(
    req,
    `/api/v1/enterprise/decomposition/plans/${planId}/tasks/${taskId}/interests`,
  );
}
