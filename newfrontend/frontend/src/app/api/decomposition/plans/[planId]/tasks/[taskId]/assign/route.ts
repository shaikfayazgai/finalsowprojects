import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Assign a plan task to a contributor → creates a contributor_tasks row. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string; taskId: string }> },
) {
  const { planId, taskId } = await params;
  return proxyToBackendService(
    req,
    `/api/v1/enterprise/decomposition/plans/${planId}/tasks/${taskId}/assign`,
  );
}
