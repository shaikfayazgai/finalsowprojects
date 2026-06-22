/**
 * POST /api/contributor/opportunities/{taskId}/withdraw
 * Contributor withdraws interest in a task.
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
  return proxyToBackendService(req, `/api/contributor/opportunities/${taskId}/withdraw`);
}
