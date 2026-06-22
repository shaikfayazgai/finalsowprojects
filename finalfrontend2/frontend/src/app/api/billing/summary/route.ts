/**
 * GET /api/billing/summary
 * Proxy → enterprise backend GET /api/v1/billing/summary
 * Returns { totalSpent, pendingPayments, escrowHeld, activeInvoices, monthlySpend }
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/billing/summary");
}
