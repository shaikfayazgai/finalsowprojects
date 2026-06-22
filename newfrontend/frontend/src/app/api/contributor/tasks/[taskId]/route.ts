/**
 * GET /api/contributor/tasks/:taskId
 *
 * Full task detail for a task the caller is assigned to. Proxies to the
 * freelancer backend (`GET /api/contributor/tasks/{id}`), which returns
 * { task: { ...ContributorTaskDetail, submissions: [...] } } scoped to the
 * caller's account (404 if the task isn't theirs).
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { taskId } = await params;
  if (!taskId) {
    return new Response(JSON.stringify({ error: "Missing taskId" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  return proxyToBackendService(req, `/api/contributor/tasks/${taskId}`);
}
