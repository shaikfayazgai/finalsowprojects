import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

/**
 * Mentor forced-reset change-password — same pattern as enterprise.
 * Forwards to the backend `/api/v1/auth/password/change` (clears
 * `must_change_password`). The proxy injects the NextAuth-held backend JWT, so
 * the caller only needs an active session.
 * Body: { new_password, confirmPassword? }
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/auth/password/change");
}
