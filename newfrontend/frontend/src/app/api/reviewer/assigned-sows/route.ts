/**
 * GET /api/reviewer/assigned-sows — SOWs this reviewer is assigned to (intake),
 * shown as soon as they're assigned (before any delivery). Proxies to :8105.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/reviewer/assigned-sows");
}
