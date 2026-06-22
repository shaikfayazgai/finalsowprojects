/**
 * SOW collection — proxied to standalone backend (Phase 2).
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/sow");
}

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/sow");
}
