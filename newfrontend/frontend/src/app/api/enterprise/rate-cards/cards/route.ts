/**
 * GET/POST /api/enterprise/rate-cards/cards
 * Multi-card rate-card list — proxies to the enterprise backend
 * (`/api/v1/enterprise/rate-cards/cards`), real per-tenant rate cards.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/enterprise/rate-cards/cards");
}

export async function POST(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/enterprise/rate-cards/cards");
}
