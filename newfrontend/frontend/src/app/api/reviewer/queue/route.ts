/**
 * GET /api/reviewer/queue — the reviewer's open review queue (pool + claimed).
 * Proxies to the reviewer backend (8105); JWT injected.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/reviewer/queue");
}
