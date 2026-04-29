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
    const sendResult = await sendEmail({
      to: email,
      subject: tpl.subject,
      html: buildEmailHtml({
        bodyHtml: tpl.bodyHtml,
        headerColor: tpl.headerColor,
        footerText: tpl.footerText,
        payload: { code, expiryMinutes: "5" },
      }),
    });

    if (!sendResult.success) {
      // Local/dev fallback: still allow verification flow to proceed when SMTP
      // is unavailable on the machine.
      if (process.env.NODE_ENV !== "production") {
        if (sendResult.error) {
          console.warn(`[send-email OTP] SMTP failed (${sendResult.error}). Dev fallback for ${email}.`);
        }
        console.warn(`[send-email OTP] SMTP unavailable. Using local fallback code for ${email}: ${code}`);
        const devRes = NextResponse.json({
          ok: true,
          message:
            "Email could not be sent (SMTP). Use the code shown below in development, or check server logs.",
          devFallback: true,
          /** Development only — never returned in production. */
          devOtp: code,
        });
        devRes.cookies.set("email_otp_token", token, {
          httpOnly: true,
          sameSite: "strict",
          path: "/",
          maxAge: 5 * 60,
        });
        return devRes;
      }

      return NextResponse.json(
        { error: "SEND_FAILED", message: "Could not send verification email. Please try again." },
        { status: 500 },
      );
    }

    console.log(`[send-email OTP] Sent successfully to: ${email}`);

    const res = NextResponse.json({ ok: true });
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
