import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { timingSafeEqual } from "node:crypto";

function getSecret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET not set");
  return new TextEncoder().encode(s);
}

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "MISSING_FIELDS", message: "Email and code are required." },
        { status: 400 },
      );
    }

    const cookieToken = req.cookies.get("email_otp_token")?.value;
    if (!cookieToken) {
      return NextResponse.json(
        { error: "NO_TOKEN", message: "No verification session found. Please request a new code." },
        { status: 400 },
      );
    }

    let payload: { email: string; code: string; expiresAt: number };
    try {
      const { payload: p } = await jwtVerify(cookieToken, getSecret());
      payload = p as typeof payload;
    } catch {
      const res = NextResponse.json(
        { error: "EXPIRED", message: "Your verification code has expired. Please request a new one." },
        { status: 400 },
      );
      res.cookies.delete("email_otp_token");
      return res;
    }

    // Check email matches (prevents cross-email reuse)
    if (payload.email !== email.toLowerCase().trim()) {
      return NextResponse.json(
        { error: "EMAIL_MISMATCH", message: "Email does not match. Please request a new code." },
        { status: 400 },
      );
    }

    // Check expiry
    if (Date.now() > payload.expiresAt) {
      const res = NextResponse.json(
        { error: "EXPIRED", message: "Your verification code has expired. Please request a new one." },
        { status: 400 },
      );
      res.cookies.delete("email_otp_token");
      return res;
    }

    // Constant-time comparison to prevent timing attacks
    const expected = Buffer.from(payload.code);
    const received = Buffer.from(code.toString().padEnd(payload.code.length, " "));
    const match =
      expected.length === received.length &&
      timingSafeEqual(expected, received);

    if (!match) {
      return NextResponse.json(
        { error: "WRONG_CODE", message: "Incorrect code. Please check and try again." },
        { status: 400 },
      );
    }

    // Valid — clear the cookie (single-use)
    const res = NextResponse.json({ ok: true, verified: true });
    res.cookies.delete("email_otp_token");
    return res;
  } catch (err) {
    console.error("[verify-email OTP]", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
