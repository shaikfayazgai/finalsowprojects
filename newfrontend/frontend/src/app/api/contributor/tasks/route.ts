/**
 * GET /api/contributor/tasks
 *
 * The contributor's assigned tasks (cross-tenant). Proxies to the freelancer
 * backend (`GET /api/contributor/tasks`), which reads contributor_tasks — the
 * real table the enterprise assign flow writes to — and returns { items: [...] }
 * in the ContributorTaskSummary shape (incl. payGrossMinor/payNetMinor).
 *
 * Query params (status, limit, category, priority) are forwarded as-is.
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/contributor/tasks");
}
