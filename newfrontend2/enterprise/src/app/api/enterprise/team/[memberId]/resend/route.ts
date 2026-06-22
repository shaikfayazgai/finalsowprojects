import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

/**
 * Resend credentials for a team member — regenerates a temp password and
 * re-emails it (forces another reset on next login). Proxies to the backend.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> },
) {
  const { memberId } = await params;
  return proxyToBackendService(req, `/api/v1/enterprise/team/${memberId}/resend`);
}
