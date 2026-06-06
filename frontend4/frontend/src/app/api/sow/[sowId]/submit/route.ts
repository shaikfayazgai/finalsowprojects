/**
 * POST /api/sow/:sowId/submit — proxied to standalone backend (Phase 2).
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
  return proxyToBackendService(req, `/api/v1/sow/${sowId}/submit`);
}
