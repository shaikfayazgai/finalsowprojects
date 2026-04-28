import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Generic response — never leak whether an email is registered.
const GENERIC_RESPONSE = {
  success: true,
  message: "If an account exists for this email, a reset link has been sent.",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 },
      );
    }

    const backendUrl = process.env.GLIMMORA_API_URL ?? process.env.NEXT_PUBLIC_GLIMMORA_API_URL;
    if (!backendUrl) {
      console.error("[forgot-password] GLIMMORA_API_URL not configured");
      return NextResponse.json(GENERIC_RESPONSE);
    }

    // Backend owns the entire flow: generates the token, persists it, sends the email.
    // We don't read the response body — backend may return 404 for unknown emails;
    // we surface the same generic message either way to avoid email enumeration.
    try {
      await fetch(`${backendUrl}/api/v1/auth/password/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      /* network error — still return generic success */
    }

    return NextResponse.json(GENERIC_RESPONSE);
  } catch {
    return NextResponse.json(GENERIC_RESPONSE);
  }
}
