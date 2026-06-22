/**
 * GET /api/contributor/mentorship/status
 *
 * Mentorship opt-in status + upcoming session. Proxies to the freelancer backend
 * (`GET /api/contributor/mentorship/status`) → { optedIn, focus, optedInAt, upcomingSession }.
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/contributor/mentorship/status");
}
