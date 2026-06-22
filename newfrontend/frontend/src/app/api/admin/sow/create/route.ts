import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

/**
 * Platform admin raises a SOW on behalf of a tenant.
 * Body: { tenantId, title, ...CreateSowInput }.
 * Proxies to the enterprise backend's admin create (admin-only, owner-targeted).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/sow/admin/create");
}
