import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

/**
 * Set a team member's roles. Body: { roleCodes: string[] }.
 * A member can hold several roles (e.g. PMO + Reviewer); one stays primary for
 * portal routing, the rest are stored as extra grants.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> },
) {
  const { memberId } = await params;
  return proxyToBackendService(req, `/api/v1/enterprise/team/${memberId}/roles`);
}
