/**
 * GET /api/contributor/profile/stats
 *
 * Real delivery record for the contributor profile "Your record" + digital-twin
 * rail. Proxies to the freelancer backend (`GET /api/contributor/profile/stats`),
 * which computes the metrics live from the contributor's own contributor_tasks
 * (taken / completed / in-flight / on-time-vs-deadline) and the mentor reviews
 * they received (rating + first-try acceptance). Auth token injected by the proxy.
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/contributor/profile/stats");
}
