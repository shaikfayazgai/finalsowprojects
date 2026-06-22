import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

/**
 * Platform-admin SOW list — ALL SOWs across every tenant (Glimmora commercial
 * gate). Proxies to the enterprise backend's admin endpoint (the gateway routes
 * /api/v1/sows → enterprise); the proxy injects the admin's session JWT, and the
 * backend enforces platform-admin role.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/sows/admin/all");
}
