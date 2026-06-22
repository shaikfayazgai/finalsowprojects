/**
 * POST /api/ai/invoke
 *
 * Proxied to super-admin backend:
 *   POST /api/ai/invoke
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return proxyToBackendService(req, "/api/ai/invoke");
}
