/**
 * POST /api/cases/{id}/messages → add a reply to the thread.
 * (Admins may pass { internal: true } for a staff-only note.)
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToBackendService(req, `/api/v1/cases/${id}/messages`);
}
