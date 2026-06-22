import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ submissionId: string; artifactId: string }> },
) {
  const { submissionId, artifactId } = await params;
  return proxyToBackendService(
    req,
    `/api/v1/submissions/${submissionId}/artifacts/${artifactId}`,
  );
}
