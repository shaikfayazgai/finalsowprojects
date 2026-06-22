/**
 * GET /api/enterprise/rate-cards-multi
 * PUT /api/enterprise/rate-cards-multi
 *
 * Proxies to enterprise backend GET/PUT /api/v1/enterprise/rate-cards.
 * Returns the tenant-level rate-card config: { tenantId, tenantCurrency, rateCards }.
 *
 * This is distinct from /api/enterprise/rate-cards which uses Prisma for
 * the legacy single-card shape; this proxy hits the standalone backend
 * which stores the full config in enterprise_rate_cards (Neon).
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/enterprise/rate-cards");
}

export async function PUT(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/enterprise/rate-cards");
}
