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

    // Derive the app origin so the backend can embed the correct reset link in the email.
    // The link must point back to OUR /auth/reset-password page, not the Glimmora backend.
    const requestUrl = new URL(req.url);
    const appOrigin = process.env.NEXTAUTH_URL
      ? new URL(process.env.NEXTAUTH_URL).origin
      : `${requestUrl.protocol}//${requestUrl.host}`;
    const resetUrl = `${appOrigin}/auth/reset-password`;

    try {
      const res = await fetch(`${backendUrl}/api/v1/auth/password/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          reset_url: resetUrl,
          redirect_url: resetUrl,
          callback_url: resetUrl,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("[forgot-password] backend error", res.status, data);
      }
    } catch (err) {
      console.error("[forgot-password] network error", err);
    }

    return NextResponse.json(GENERIC_RESPONSE);
  } catch {
    return NextResponse.json(GENERIC_RESPONSE);
  }
}
