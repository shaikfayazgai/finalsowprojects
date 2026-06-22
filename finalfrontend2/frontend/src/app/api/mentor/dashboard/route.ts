/**
 * Mentor dashboard stats — proxied to real backend GET /api/mentor/dashboard.
 * Returns { success, data: { stats: { pending_reviews, completed_reviews,
 *   total_reviews, mentees, escalations }, recent_queue } }
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/mentor/dashboard");
}
