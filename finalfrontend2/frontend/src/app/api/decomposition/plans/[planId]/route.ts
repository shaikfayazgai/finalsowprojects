/**
 *   GET   /api/decomposition/plans/:planId  → full detail
 *   PATCH /api/decomposition/plans/:planId  → update meta / replace structure
 * Proxied to the real enterprise backend (/api/v1/enterprise/decomposition/plans/{id}).
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  const { planId } = await params;
  return proxyToBackendService(
    req,
    `/api/v1/enterprise/decomposition/plans/${encodeURIComponent(planId)}`,
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  const { planId } = await params;
  return proxyToBackendService(
    req,
    `/api/v1/enterprise/decomposition/plans/${encodeURIComponent(planId)}`,
  );
}
