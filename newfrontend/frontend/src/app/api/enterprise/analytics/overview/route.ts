/**
 * GET /api/enterprise/analytics/overview
 * Enterprise analytics overview — proxies to the enterprise backend
 * (`/api/v1/enterprise/analytics/overview`), computed live from this tenant's
 * delivery data (tasks, pricing, payouts). No mock.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/enterprise/analytics/overview");
}
