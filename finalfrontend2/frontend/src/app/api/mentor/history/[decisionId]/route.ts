/**
 * GET /api/mentor/history/[decisionId]
 * Proxies to the mentor backend: GET /api/mentor/queue/{id}
 * The backend stores all reviews (including decided ones) in mentor_reviews.
 * decisionId == mentor_reviews.id (numeric in backend, string in FE URL).
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ decisionId: string }> },
) {
  const { decisionId } = await ctx.params;
  return proxyToBackendService(req, `/api/mentor/queue/${encodeURIComponent(decisionId)}`);
}
