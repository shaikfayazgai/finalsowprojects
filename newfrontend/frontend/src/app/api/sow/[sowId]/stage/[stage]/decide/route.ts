import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

/**
 * Decide an approval stage — enterprise gates (finance/security/legal) + the
 * Glimmora platform gate (commercial). Body: { decision: "approve"|"reject", comment? }.
 * Proxies to the enterprise backend's stage-decide; JWT injected, actor recorded.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sowId: string; stage: string }> },
) {
  const { sowId, stage } = await params;
  return proxyToBackendService(req, `/api/v1/approvals/${sowId}/stage/${stage}/decide`);
}
