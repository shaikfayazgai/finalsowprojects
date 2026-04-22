import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import crypto from "crypto";
import { sendEmail, buildEmailHtml } from "@/lib/email";
import { DEFAULT_TEMPLATES } from "@/lib/stores/email-template-store";

function getSecret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET not set");
  return new TextEncoder().encode(s);
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "INVALID_EMAIL", message: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const code = String(crypto.randomInt(100000, 999999));
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Sign the OTP payload into a JWT so no DB is needed
    const token = await new SignJWT({ email: email.toLowerCase().trim(), code, expiresAt })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("5m")
      .sign(getSecret());

    const tpl = DEFAULT_TEMPLATES.otp_email;

    console.log(`[send-email OTP] Sending code to: ${email}`);
    const result = await sendEmail({
      to: email,
      subject: tpl.subject,
      html: buildEmailHtml({
        bodyHtml: tpl.bodyHtml,
        headerColor: tpl.headerColor,
        footerText: tpl.footerText,
        payload: { code, expiryMinutes: "5" },
      }),
    });

    const isDev = process.env.NODE_ENV !== "production";
    if (!success) {
      if (!isDev) {
        return NextResponse.json(
          { error: "SEND_FAILED", message: "Could not send verification email. Please try again." },
          { status: 500 },
        );
      }

      console.warn(
        `[send-email OTP] Email provider failed in development. Using local OTP fallback for: ${email}`,
      );
    } else {
      console.log(`[send-email OTP] Sent successfully to: ${email}`);
    }

    const res = NextResponse.json(
      success
        ? { ok: true }
        : {
            ok: true,
            devFallback: true,
            devOtp: code,
            message: "Email provider failed in development. OTP generated locally.",
          },
    );
    res.cookies.set("email_otp_token", token, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 5 * 60,
    });
    return res;
  } catch (err) {
    console.error("[send-email OTP]", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
