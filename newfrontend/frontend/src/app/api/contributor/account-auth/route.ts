/**
 * GET /api/contributor/account-auth
 *
 * Sign-in method summary for contributor Settings (password vs OAuth vs SSO).
 * Proxies to the freelancer backend (`GET /api/contributor/account-auth`), which
 * derives the mode from login_accounts and returns the ContributorAccountAuth shape.
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/contributor/account-auth");
}
