/**
 * Contributor · payout list — proxied to the real freelancer backend (canonical
 * `payouts` table). Shape: PayoutListResponse { items, total, page, limit }.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { search } = new URL(req.url);
  return proxyToBackendService(req, `/api/contributor/payouts${search}`);
}
