/**
 * POST /api/decomposition/plans/:planId/fund-escrow — Enterprise pre-funds
 * (releases) its SOW budget to Glimmora up front, full or partial, once the
 * work is priced — without waiting for task delivery. Held in the SOW escrow;
 * Glimmora draws contributor payouts from it as work completes.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  return proxyToBackendService(req, `/api/v1/enterprise/decomposition/plans/${planId}/fund-escrow`);
}
