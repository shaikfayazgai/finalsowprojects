/**
 *   GET  /api/mentor/sessions    → list mentor's sessions (filters via query)
 *   POST /api/mentor/sessions    → schedule a new session
 *
 *   Proxied to mentor backend :8101  /api/mentor/sessions
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/mentor/sessions");
}

export async function POST(req: NextRequest) {
  return proxyToBackendService(req, "/api/mentor/sessions");
}
