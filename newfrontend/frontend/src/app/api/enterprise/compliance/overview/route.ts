/**
 * GET /api/enterprise/compliance/overview
 *
 * Proxies to the enterprise backend (`/api/v1/enterprise/compliance/overview`),
 * which computes the tenant's consent coverage (real consent flags on
 * contributor_profiles), retention floors, and deletion-request counts (from
 * the Mongo audit log). Auth token injected server-side.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/enterprise/compliance/overview");
}
