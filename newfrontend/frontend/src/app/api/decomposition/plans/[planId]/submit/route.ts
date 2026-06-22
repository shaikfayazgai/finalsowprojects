/**
 * POST /api/decomposition/plans/:planId/submit — enterprise submits the draft
 * plan to Glimmora (super admin) for pricing + approval. Proxies to the backend.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  return proxyToBackendService(req, `/api/v1/enterprise/decomposition/plans/${planId}/submit`);
}
