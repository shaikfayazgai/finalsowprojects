import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// OTP-verified password reset: the backend re-checks the email OTP and, if
// valid, sets the new password and returns a fresh token pair. Used by the
// forgot-password page (OTP flow) for every role.
export async function POST(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/auth/password/setup-after-otp");
}
