/**
 * GET/PUT /api/admin/commission — the platform commission % the super-admin sets.
 * Proxies to the super-admin backend (/api/v1/settings/commission). The commission
 * drives clientPrice = contributorPayout / (1 - commission%/100).
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/settings/commission");
}

export async function PUT(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/settings/commission");
}
