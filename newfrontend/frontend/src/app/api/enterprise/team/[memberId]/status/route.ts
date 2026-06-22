import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

/**
 * Activate / deactivate a team member. Body: { active: boolean }.
 * Deactivating only flips is_active — no row is deleted.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> },
) {
  const { memberId } = await params;
  return proxyToBackendService(req, `/api/v1/enterprise/team/${memberId}/status`);
}
