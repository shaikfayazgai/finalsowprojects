/**
 * POST /api/decomposition/plans/:planId/payout-contributors — Glimmora disburses
 * to contributors for released tasks (released → paid; task → paid).
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  return proxyToBackendService(req, `/api/v1/enterprise/decomposition/plans/${planId}/payout-contributors`);
}
