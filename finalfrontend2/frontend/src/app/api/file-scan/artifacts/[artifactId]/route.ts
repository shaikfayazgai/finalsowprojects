/**
 * GET /api/file-scan/artifacts/[artifactId]
 *
 * Proxied to super-admin backend:
 *   GET /api/file-scan/artifacts/{artifact_id}
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ artifactId: string }> },
) {
  const { artifactId } = await params;
  return proxyToBackendService(req, `/api/file-scan/artifacts/${encodeURIComponent(artifactId)}`);
}
