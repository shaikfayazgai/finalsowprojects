/**
 * GET /api/superadmin/audit-log — paginated, filterable audit trail from the
 * Mongo `audit_log` collection (written by every backend service). Super admin only.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/superadmin/audit-log");
}
