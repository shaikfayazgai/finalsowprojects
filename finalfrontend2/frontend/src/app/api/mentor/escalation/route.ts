/**
 * GET  /api/mentor/escalation  → list mentor escalations
 * POST /api/mentor/escalation  → create escalation
 * Proxied to mentor backend /api/mentor/escalation
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/mentor/escalation");
}

export async function POST(req: NextRequest) {
  return proxyToBackendService(req, "/api/mentor/escalation");
}
