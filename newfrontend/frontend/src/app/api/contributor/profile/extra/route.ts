/**
 * GET/PATCH /api/contributor/profile/extra — the richer 10-step wizard data
 * (languages, professional links, preferences, verification meta, certifications)
 * stored in contributor_profiles.profile_extra. PATCH shallow-merges. Proxies to
 * the freelancer backend.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/contributor/profile/extra");
}
export async function PATCH(req: NextRequest) {
  return proxyToBackendService(req, "/api/contributor/profile/extra");
}
