/**
 * POST /api/decomposition/plans/{planId}/tasks/{taskId}/select
 * Enterprise picks ONE interested contributor → assigns the task to them.
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
    `/api/v1/enterprise/decomposition/plans/${planId}/tasks/${taskId}/select`,
  );
}
