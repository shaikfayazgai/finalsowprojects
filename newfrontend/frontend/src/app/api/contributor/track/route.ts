/**
 * GET /api/contributor/track
 *
 * Contributor persona + onboarding/KYC gate. Proxies to the freelancer backend
 * (`GET /api/contributor/track`), which derives the track from contributor_profiles
 * + contributor_kyc and returns the ContributorTrackStatus shape directly.
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/contributor/track");
}
