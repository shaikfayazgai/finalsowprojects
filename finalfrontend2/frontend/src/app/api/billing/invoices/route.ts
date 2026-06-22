/**
 * GET  /api/billing/invoices        → list invoices
 * POST /api/billing/invoices        → create invoice
 * Proxy → enterprise backend /api/v1/billing/invoices
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/billing/invoices");
}

export async function POST(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/billing/invoices");
}
