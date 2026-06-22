/**
 * POST /api/contributor/opportunities/{taskId}/interest
 * Contributor expresses interest in an open task → writes task_interests.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { taskId } = await params;
  return proxyToBackendService(req, `/api/contributor/opportunities/${taskId}/interest`);
}
