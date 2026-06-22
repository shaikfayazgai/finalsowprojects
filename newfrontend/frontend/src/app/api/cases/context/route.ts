/**
 * GET /api/cases/context → reference items for the raise form's live dropdowns
 * (e.g. the contributor's own tasks). Role-scoped server-side.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/cases/context");
}
