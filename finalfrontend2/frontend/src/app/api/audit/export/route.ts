/**
 * GET /api/audit/export — proxied to the real backend (MongoDB-backed audit log).
 * Supports format=csv|json|ndjson + filter query params. Backend: /api/audit/export
 * (routed via the gateway to the super-admin service). Auth + tenant scoping are
 * enforced server-side by the backend.
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/audit/export");
}
