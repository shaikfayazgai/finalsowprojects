/**
 * POST /api/decomposition/plans/{planId}/tasks/{taskId}/publish
 * Open a task for interest: notify skill-matched contributors + set a window
 * (durationHours). Proxies to the enterprise backend.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string; taskId: string }> },
) {
  const { planId, taskId } = await params;
  return proxyToBackendService(
    req,
    `/api/v1/enterprise/decomposition/plans/${planId}/tasks/${taskId}/publish`,
  );
}
