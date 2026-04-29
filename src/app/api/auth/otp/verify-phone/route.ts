import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json();
    if (!phone || !code) {
      return NextResponse.json(
        { error: "MISSING_FIELDS", message: "Phone and code are required." },
        { status: 400 },
      );
    }

    const backendUrl = process.env.GLIMMORA_API_URL ?? process.env.NEXT_PUBLIC_GLIMMORA_API_URL;

    const backendRes = await fetch(`${backendUrl}/api/v1/auth/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile_number: phone, otp_code: String(code) }),
      signal: AbortSignal.timeout(10000),
    });

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      const message = data?.detail ?? data?.message ?? "Invalid or expired code. Please try again.";
      return NextResponse.json({ error: "WRONG_CODE", message }, { status: backendRes.status });
    }

    return NextResponse.json({ ok: true, verified: true });
  } catch (err) {
    console.error("[verify-phone OTP]", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
