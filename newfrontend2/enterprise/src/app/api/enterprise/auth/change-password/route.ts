import { NextRequest, NextResponse } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

/**
 * Enterprise forced-reset change-password.
 *
 * Forwards directly to the FastAPI backend's `/api/v1/auth/password/change`
 * so the backend's `must_change_password` flag is cleared (its `set_password`
 * clears the flag by default). The proxy injects the NextAuth-held backend JWT
 * as `Authorization: Bearer …`, so the caller only needs an active session.
 *
 * Body: { new_password, confirmPassword?, old_password? }
 * For a first-login default-password reset, old_password is not required.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/auth/password/change");
}
