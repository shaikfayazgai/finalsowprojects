/**
 * GET /api/reviewer/queue/:reviewId — a single reviewer queue item (assignment).
 * Proxies to the reviewer backend (8105); JWT injected.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = await params;
  return proxyToBackendService(req, `/api/v1/reviewer/queue/${encodeURIComponent(reviewId)}`);
}
