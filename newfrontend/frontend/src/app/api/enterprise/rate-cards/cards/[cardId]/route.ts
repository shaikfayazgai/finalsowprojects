/**
 * GET/PATCH /api/enterprise/rate-cards/cards/{cardId}
 * Single rate card (detail / update) — proxies to the enterprise backend.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cardId: string }> },
) {
  const { cardId } = await params;
  return proxyToBackendService(req, `/api/v1/enterprise/rate-cards/cards/${cardId}`);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ cardId: string }> },
) {
  const { cardId } = await params;
  return proxyToBackendService(req, `/api/v1/enterprise/rate-cards/cards/${cardId}`);
}
