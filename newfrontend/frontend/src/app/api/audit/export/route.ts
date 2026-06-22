/**
 * GET /api/audit/export
 *
 * Tenant audit timeline — proxies to the enterprise backend
 * (`/api/v1/enterprise/audit`), which reads the real Mongo audit log scoped to
 * the caller's tenant and returns the ExportJsonShape the audit view expects.
 * Filters (actionPrefix, severity, actorUserId, resourceType, from, to, limit,
 * format) are forwarded. No Prisma, no mock.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/enterprise/audit");
}
