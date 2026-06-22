import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ evidenceId: string }> },
) {
  const { evidenceId } = await params;
  return proxyToBackendService(req, `/api/contributor/profile/evidence/${evidenceId}`);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ evidenceId: string }> },
) {
  const { evidenceId } = await params;
  return proxyToBackendService(req, `/api/contributor/profile/evidence/${evidenceId}`);
}
