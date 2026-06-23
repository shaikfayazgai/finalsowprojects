/**
 * POST /api/decomposition/plans/:planId/request-topup — Glimmora asks the
 * enterprise to top up the SOW escrow (release more budget) when the pre-funded
 * balance is running low. Notifies the enterprise.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  return proxyToBackendService(req, `/api/v1/enterprise/decomposition/plans/${planId}/request-topup`);
}
