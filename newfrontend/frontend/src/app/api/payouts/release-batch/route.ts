/**
 * POST /api/payouts/release-batch
 * Release all eligible tenant payouts as a batch → reviewer/enterprise backend.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/payouts/release-batch");
}
