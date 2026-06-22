import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

/**
 * Assign / reassign the enterprise reviewer on a SOW.
 * Body: { reviewerId, reviewerName?, reviewerEmail? } (empty id clears it).
 * Proxies to the enterprise backend; JWT injected, owner-scoped server-side.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sowId: string }> },
) {
  const { sowId } = await params;
  return proxyToBackendService(req, `/api/v1/sow/${sowId}/reviewer`);
}
