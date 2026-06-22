/**
 * GET /api/contributor/opportunities/{taskId}
 * Full detail for one open opportunity — brief, acceptance criteria, uploaded
 * files (attachments), skills, timing + price — so a contributor can review
 * everything before expressing interest.
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
  return proxyToBackendService(req, `/api/contributor/opportunities/${taskId}`);
}
