/**
 * POST /api/auth/password/setup-after-otp — proxied to the backend.
 * Sets a new password after the email OTP was verified (forgot-password flow).
 * Backend: POST /api/v1/auth/password/setup-after-otp { email, code, new_password }.
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/auth/password/setup-after-otp");
}
