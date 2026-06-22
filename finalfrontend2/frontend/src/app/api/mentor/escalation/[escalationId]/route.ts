/**
 * GET   /api/mentor/escalation/[escalationId] → get single escalation
 * PATCH /api/mentor/escalation/[escalationId] → update escalation status
 * Proxied to mentor backend /api/mentor/escalation/{id}
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ escalationId: string }> },
) {
  const { escalationId } = await ctx.params;
  return proxyToBackendService(req, `/api/mentor/escalation/${encodeURIComponent(escalationId)}`);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ escalationId: string }> },
) {
  const { escalationId } = await ctx.params;
  return proxyToBackendService(req, `/api/mentor/escalation/${encodeURIComponent(escalationId)}`);
}
