import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

/**
 * Team member resource. DELETE permanently removes the login account
 * (hard delete) — tenant-scoped, enforced by the backend.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> },
) {
  const { memberId } = await params;
  return proxyToBackendService(req, `/api/v1/enterprise/team/${memberId}`);
}
