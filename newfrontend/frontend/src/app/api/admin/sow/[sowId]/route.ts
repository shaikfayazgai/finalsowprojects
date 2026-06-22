import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

/**
 * Platform-admin single SOW (any tenant). Proxies to the enterprise backend's
 * admin-scoped get (`/api/v1/sows/{id}` returns the row with owner_scope=None for
 * platform admins). The proxy injects the admin's session JWT.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sowId: string }> },
) {
  const { sowId } = await params;
  return proxyToBackendService(req, `/api/v1/sows/${sowId}`);
}
