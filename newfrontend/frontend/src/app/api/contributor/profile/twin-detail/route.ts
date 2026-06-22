/**
 * GET /api/contributor/profile/twin-detail
 *
 * Full digital-twin record for the contributor /profile/digital-twin page
 * (activity chart, reliability signals, reinforcing skills, streaks, trend,
 * derived observations). Proxies to the freelancer backend
 * (`GET /api/contributor/profile/twin-detail`), which computes it live from the
 * contributor's own tasks + the mentor reviews they received. Auth token
 * injected by the proxy.
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/contributor/profile/twin-detail");
}
