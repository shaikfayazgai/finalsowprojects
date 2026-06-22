/**
 * GET /api/contributor/track — proxied to the real backend.
 * Returns contributor track (persona) + onboarding completion.
 * Backend: GET /api/contributor/track (auth via injected session bearer).
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/contributor/track");
}
