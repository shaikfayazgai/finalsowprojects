/**
 * GET/PATCH/POST /api/admin/tenants/[tenantId]/subscription
 *
 * Proxied to super-admin backend:
 *   GET   /api/admin/tenants/{tenantId}/subscription
 *   PATCH /api/admin/tenants/{tenantId}/subscription
 *   POST  /api/admin/tenants/{tenantId}/subscription  (usage increment)
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await ctx.params;
  return proxyToBackendService(req, `/api/admin/tenants/${encodeURIComponent(tenantId)}/subscription`);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await ctx.params;
  return proxyToBackendService(req, `/api/admin/tenants/${encodeURIComponent(tenantId)}/subscription`);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await ctx.params;
  return proxyToBackendService(req, `/api/admin/tenants/${encodeURIComponent(tenantId)}/subscription`);
}
