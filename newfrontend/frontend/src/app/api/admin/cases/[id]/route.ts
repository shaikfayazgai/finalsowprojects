/**
 * Admin desk — one case.
 *   GET   /api/admin/cases/{id} → full case + thread (incl. internal notes)
 *   PATCH /api/admin/cases/{id} → triage / assign / resolve / close
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToBackendService(req, `/api/v1/cases/${id}`);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToBackendService(req, `/api/v1/admin/cases/${id}`);
}
