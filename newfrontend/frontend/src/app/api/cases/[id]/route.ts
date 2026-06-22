/**
 * GET /api/cases/{id} → one case + its thread (owner sees public messages only).
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
