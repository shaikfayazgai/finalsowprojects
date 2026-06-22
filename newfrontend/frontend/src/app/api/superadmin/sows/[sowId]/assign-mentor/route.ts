import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

/**
 * Assign / reassign the Glimmora delivery mentor for a SOW (platform-admin).
 * Body: { mentorId, mentorName?, mentorEmail? }.
 * Proxies to super-admin `/api/superadmin/sows/{id}/assign-mentor`.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sowId: string }> },
) {
  const { sowId } = await params;
  return proxyToBackendService(req, `/api/superadmin/sows/${sowId}/mentor`);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sowId: string }> },
) {
  const { sowId } = await params;
  return proxyToBackendService(req, `/api/superadmin/sows/${sowId}/assign-mentor`);
}
