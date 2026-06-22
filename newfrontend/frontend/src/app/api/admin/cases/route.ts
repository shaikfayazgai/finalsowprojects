/**
 * GET /api/admin/cases → the Glimmora desk: every case (admin only).
 * Query: ?stream=support|complaint &status=... (forwarded to the backend).
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/admin/cases");
}
