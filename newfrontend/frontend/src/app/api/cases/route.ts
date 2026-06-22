/**
 * Cases — Support + Complaints (Resolution Center, Phase 1).
 *   GET  /api/cases       → my own cases (any role)
 *   POST /api/cases       → raise a Support question or Complaint
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/cases/mine");
}

export async function POST(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/cases");
}
