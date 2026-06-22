import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Assignable contributors for the task-assign picker (enterprise). */
export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/enterprise/decomposition/contributors");
}
