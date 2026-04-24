import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { timingSafeEqual } from "node:crypto";

function getSecret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET not set");
  return new TextEncoder().encode(s);
}

function normalizeIndianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length === 13 && digits.startsWith("091")) return `+91${digits.slice(3)}`;
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json();
    if (!phone || !code) {
      return NextResponse.json(
        { error: "MISSING_FIELDS", message: "Phone and code are required." },
        { status: 400 },
      );
    }

    const normalizedPhone = normalizeIndianPhone(String(phone));
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: "INVALID_PHONE", message: "Please use a valid Indian mobile number." },
        { status: 400 },
      );
    }

    const cookieToken = req.cookies.get("phone_otp_token")?.value;
    if (!cookieToken) {
      return NextResponse.json(
        { error: "NO_TOKEN", message: "No verification session found. Please request a new code." },
        { status: 400 },
      );
    }

    let payload: { phone: string; code: string; expiresAt: number };
    try {
      const { payload: p } = await jwtVerify(cookieToken, getSecret());
      payload = p as typeof payload;
    } catch {
      const res = NextResponse.json(
        { error: "EXPIRED", message: "Your verification code has expired. Please request a new one." },
        { status: 400 },
      );
      res.cookies.delete("phone_otp_token");
      return res;
    }

    if (payload.phone !== normalizedPhone) {
      return NextResponse.json(
        { error: "PHONE_MISMATCH", message: "Phone number does not match. Please request a new code." },
        { status: 400 },
      );
    }

    if (Date.now() > payload.expiresAt) {
      const res = NextResponse.json(
        { error: "EXPIRED", message: "Your verification code has expired. Please request a new one." },
        { status: 400 },
      );
      res.cookies.delete("phone_otp_token");
      return res;
    }

    const expected = Buffer.from(payload.code);
    const received = Buffer.from(String(code).padEnd(payload.code.length, " "));
    const match = expected.length === received.length && timingSafeEqual(expected, received);
    if (!match) {
      return NextResponse.json(
        { error: "WRONG_CODE", message: "Incorrect code. Please check and try again." },
        { status: 400 },
      );
    }

    const res = NextResponse.json({ ok: true, verified: true });
    res.cookies.delete("phone_otp_token");
    return res;
  } catch (err) {
    console.error("[verify-phone OTP]", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
