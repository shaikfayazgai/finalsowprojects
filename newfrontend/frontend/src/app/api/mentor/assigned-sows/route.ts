/**
 * GET /api/mentor/assigned-sows — SOWs this mentor is assigned to (intake).
 * Proxies to the mentor backend (:8101).
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/mentor/assigned-sows");
}
