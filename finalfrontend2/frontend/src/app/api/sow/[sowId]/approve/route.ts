/**
 * POST /api/sow/:sowId/approve — proxied to the enterprise backend.
 * Backend enforces auth + per-stage signing; we just forward (the session
 * bearer is injected by proxyToBackendService). No Prisma permission check.
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sowId: string }> },
) {
  const { sowId } = await params;
  return proxyToBackendService(req, `/api/v1/sow/${encodeURIComponent(sowId)}/approve`);
}
