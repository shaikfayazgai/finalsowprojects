import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

/**
 * Platform commercial decision — approve / reject the Glimmora commercial stage.
 * Body: { decision: "approve" | "reject", comment?: string }.
 * Proxies to the enterprise backend's approvals stage-decide for the `commercial`
 * stage (the Glimmora/platform gate). JWT injected; backend records the actor.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sowId: string }> },
) {
  const { sowId } = await params;
  return proxyToBackendService(req, `/api/v1/approvals/${sowId}/stage/commercial/decide`);
}
