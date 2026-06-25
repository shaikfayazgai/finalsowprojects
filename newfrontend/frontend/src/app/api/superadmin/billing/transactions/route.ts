import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

/**
 * Super-admin (Glimmora) billing transactions ledger.
 * Proxies to the super-admin backend GET /api/v1/superadmin/billing/transactions
 * (query params direction/status/limit are forwarded automatically).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/superadmin/billing/transactions");
}
