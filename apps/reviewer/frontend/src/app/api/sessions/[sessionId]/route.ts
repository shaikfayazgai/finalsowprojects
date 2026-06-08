import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  return proxyToBackendService(req, `/api/v1/sessions/${sessionId}`);
}
