import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

/**
 * Platform-admin dashboard metrics (real DB counts).
 * Proxies to the super-admin backend GET /api/superadmin/dashboard.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/superadmin/dashboard");
}
