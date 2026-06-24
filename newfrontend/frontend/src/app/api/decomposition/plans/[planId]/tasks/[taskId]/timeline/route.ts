/**
 * GET /api/decomposition/plans/{planId}/tasks/{taskId}/timeline
 * Enterprise task lifecycle activity (created → sourced → submitted → mentor →
 * QA → rated → paid). Proxies to the enterprise decomposition backend.
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
    `/api/v1/enterprise/decomposition/plans/${planId}/tasks/${taskId}/timeline`,
  );
}
