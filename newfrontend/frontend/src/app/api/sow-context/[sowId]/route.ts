/**
 * GET /api/sow-context/:sowId — read-only SOW scope + decomposition task statuses
 * for delivery reviewers (mentor + reviewer). Excludes all commercial/budget data
 * (enforced server-side). Portal-neutral: proxies to the enterprise backend with
 * whatever session token the caller holds (mentor / reviewer / enterprise).
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ sowId: string }> }) {
  const { sowId } = await params;
  return proxyToBackendService(req, `/api/v1/enterprise/decomposition/sows/${encodeURIComponent(sowId)}/work-context`);
}
