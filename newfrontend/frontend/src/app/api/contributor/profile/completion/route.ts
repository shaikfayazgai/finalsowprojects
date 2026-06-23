/**
 * GET /api/contributor/profile/completion
 *
 * Profile-completion status for the contributor (freelancer). Proxies to the
 * freelancer backend (`GET /api/contributor/profile/completion`), which returns
 * { completeness: 0..100, complete: boolean, sections: {...}, missing: [...] }
 * computed live from the gated profile sections. Drives the circular completion
 * ring on the profile + the 100%-required gate on the public task marketplace.
 * Auth token injected by the proxy.
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/contributor/profile/completion");
}
