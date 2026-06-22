/**
 *   GET   /api/decomposition/plans/:planId  → full plan detail (milestones/tasks/deps)
 *   PATCH /api/decomposition/plans/:planId  → update meta / replace structure
 * Proxies to the enterprise backend; JWT injected, tenant-scoped server-side.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  return proxyToBackendService(req, `/api/v1/enterprise/decomposition/plans/${planId}`);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  return proxyToBackendService(req, `/api/v1/enterprise/decomposition/plans/${planId}`);
}
