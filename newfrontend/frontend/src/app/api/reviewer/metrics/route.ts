/**
 * GET /api/reviewer/metrics — aggregate reviewer metrics (last 30 days).
 * Proxies to the reviewer backend (8105); JWT injected.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/reviewer/metrics");
}
