/**
 * POST /api/contributor/mentorship/opt-in
 *
 * Opt the contributor into the mentorship program. Proxies to the freelancer
 * backend (`POST /api/contributor/mentorship/opt-in`), which records the opt-in
 * on contributor_mentorship and returns the session/assignment.
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return proxyToBackendService(req, "/api/contributor/mentorship/opt-in");
}
