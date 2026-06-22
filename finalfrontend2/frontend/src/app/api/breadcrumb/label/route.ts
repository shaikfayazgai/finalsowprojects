/**
 * GET /api/breadcrumb/label?type=<entity>&id=<id>
 *
 * Proxied to super-admin backend:
 *   GET /api/breadcrumb/label
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/breadcrumb/label");
}
