/**
 * Contributor · completed tasks — proxied to the real freelancer backend, which
 * joins completed `contributor_tasks` with their real `payouts`. Shape:
 * CompletedTaskListResponse { items, total, totalEarnedMinor }.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/contributor/tasks/completed");
}
