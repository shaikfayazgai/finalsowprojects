import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { SignJWT } from "jose";

function getSecret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET not set");
  return new TextEncoder().encode(s);
}

function normalizeIndianPhone(raw: string): { e164: string; local10: string } | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return { e164: `+91${digits}`, local10: digits };
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return { e164: `+${digits}`, local10: digits.slice(2) };
  }
  if (digits.length === 13 && digits.startsWith("091")) {
    return { e164: `+91${digits.slice(3)}`, local10: digits.slice(3) };
  }
  return null;
}

function is2FactorSuccess(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const rec = body as Record<string, unknown>;
  const status = typeof rec.Status === "string" ? rec.Status.toLowerCase() : "";
  return status === "success";
}

function setPhoneOtpCookie(res: NextResponse, token: string) {
  res.cookies.set("phone_otp_token", token, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 5 * 60,
  });
}

export async function POST(req: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production";

  try {
    const { phone } = await req.json();
    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "INVALID_PHONE", message: "Please enter a valid phone number." },
        { status: 400 },
      );
    }

    const normalized = normalizeIndianPhone(phone);
    if (!normalized) {
      return NextResponse.json(
        {
          error: "INVALID_PHONE",
          message:
            "SMS OTP supports Indian mobile numbers only (10 digits, or +91…). Example: 9876543210.",
        },
        { status: 400 },
      );
    }

    const code = String(randomInt(100000, 999999));
    const expiresAt = Date.now() + 5 * 60 * 1000;
    const token = await new SignJWT({ phone: normalized.e164, code, expiresAt })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("5m")
      .sign(getSecret());

    const key = process.env.TWO_FACTOR_API_KEY?.trim();

    const devFallbackResponse = () => {
      console.warn(
        `[send-phone OTP] Dev fallback — SMS not used. Code for ${normalized.e164}: ${code}`,
      );
      const res = NextResponse.json({
        ok: true,
        message:
          "SMS could not be sent. Use the code shown below in development, or configure TWO_FACTOR_API_KEY.",
        devFallback: true,
        devOtp: code,
      });
      setPhoneOtpCookie(res, token);
      return res;
    };

    if (!key) {
      if (isDev) {
        return devFallbackResponse();
      }
      return NextResponse.json(
        { error: "SMS_NOT_CONFIGURED", message: "SMS gateway key is not configured." },
        { status: 503 },
      );
    }

    const url = `https://2factor.in/API/V1/${encodeURIComponent(key)}/SMS/${normalized.local10}/${code}`;
    const smsRes = await fetch(url, { method: "GET" });
    const body = await smsRes.json().catch(() => ({}));

    if (!smsRes.ok || !is2FactorSuccess(body)) {
      if (isDev) {
        console.warn(
          `[send-phone OTP] Provider error (status ${smsRes.ok ? "ok" : smsRes.status}). Body:`,
          body,
        );
        return devFallbackResponse();
      }
      return NextResponse.json(
        { error: "SMS_SEND_FAILED", message: "Could not send SMS OTP. Please try again." },
        { status: 503 },
      );
    }

    const res = NextResponse.json({ ok: true });
    setPhoneOtpCookie(res, token);
    return res;
  } catch (err) {
    console.error("[send-phone OTP]", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
