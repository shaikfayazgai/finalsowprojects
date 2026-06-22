/**
 * Mentor profile "Mentorship" tile — proxies to the real mentor backend
 * (`/api/mentor/portal/mentorship-stats`), which counts held sessions this
 * month + active mentees from the `mentor_sessions` table. No mock.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/mentor/portal/mentorship-stats");
}
