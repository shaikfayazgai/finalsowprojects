/**
 * Decomposition plans collection — REAL backend.
 *   GET  /api/decomposition/plans  → list tenant plans  (?sowId=&status=&includeArchived=)
 *   POST /api/decomposition/plans  → create a draft plan (body: { sowId, summary, structure })
 * Proxies to the enterprise backend's normalized decomposition API; JWT injected.
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
