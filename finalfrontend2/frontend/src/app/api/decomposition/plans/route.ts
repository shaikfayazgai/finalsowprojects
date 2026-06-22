/**
 * Decomposition plans collection — proxied to the real enterprise backend.
 *   GET  /api/decomposition/plans  → list plans (tenant scope)
 *   POST /api/decomposition/plans  → create draft plan
 * Backend: /api/v1/enterprise/decomposition/plans (routed via the gateway).
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/enterprise/decomposition/plans");
}

export async function POST(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/enterprise/decomposition/plans");
}
