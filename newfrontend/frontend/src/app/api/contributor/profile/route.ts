/**
 * GET/PATCH /api/contributor/profile
 *
 * Contributor profile read + edit. Proxies to the freelancer backend
 * (`GET`/`PATCH /api/contributor/profile`) via proxyToBackendService, which
 * injects the NextAuth session's backend token. The backend reads/writes
 * contributor_profiles (+ login_accounts name/phone) — so edits persist.
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/contributor/profile");
}

export async function PATCH(req: NextRequest) {
  return proxyToBackendService(req, "/api/contributor/profile");
}
