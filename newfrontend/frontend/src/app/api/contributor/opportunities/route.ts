/**
 * GET /api/contributor/opportunities
 *
 * Open, priced decomposition tasks the contributor can express interest in
 * (net pay shown, skill-matched). Proxies to the freelancer backend.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/contributor/opportunities");
}
