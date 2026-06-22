import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string; uploadId: string }> },
) {
  const { taskId, uploadId } = await params;
  return proxyToBackendService(req, `/api/contributor/tasks/${taskId}/workroom/uploads/${uploadId}`);
}
