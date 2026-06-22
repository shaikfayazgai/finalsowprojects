/**
 * Contributor · earnings summary — proxied to the real freelancer backend, which
 * reads the canonical `payouts` table (no longer mock). Shape: EarningsSummaryResponse.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/contributor/earnings/summary");
}
