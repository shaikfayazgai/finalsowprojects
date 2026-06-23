/**
 * PATCH /api/contributor/profile/expertise — set the contributor's expertise
 * areas (a gating section for profile completion). Returns the recomputed
 * completion status. Proxies to the freelancer backend.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  return proxyToBackendService(req, "/api/contributor/profile/expertise");
}
