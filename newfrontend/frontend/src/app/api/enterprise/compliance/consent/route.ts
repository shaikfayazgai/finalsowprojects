/**
 * GET /api/enterprise/compliance/consent
 *
 * Tenant-scoped consent inventory — proxies to the enterprise backend
 * (`/api/v1/enterprise/compliance/consent`), which reads the real consent
 * flags off contributor_profiles for contributors assigned to this tenant's
 * tasks. Supports ?search, ?missing, ?format=csv, ?limit (forwarded).
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/enterprise/compliance/consent");
}
