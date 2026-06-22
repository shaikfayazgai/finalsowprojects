/**
 * GET /api/decomposition/plans/:planId/payment-transactions — Enterprise payment
 * history for a SOW (each budget release the enterprise made). Budget only.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  return proxyToBackendService(req, `/api/v1/enterprise/decomposition/plans/${planId}/payment-transactions`);
}
