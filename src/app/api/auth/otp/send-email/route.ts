import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { SignJWT } from "jose";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Send the email
    const { error: sendError } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
      to: email,
      subject: "Your GlimmoraTeam verification code",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
          <div style="text-align:center;margin-bottom:28px;">
            <div style="display:inline-block;background:linear-gradient(135deg,#7C5C3E,#5C3D1E);border-radius:12px;padding:12px 20px;">
              <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:0.5px;">GlimmoraTeam</span>
            </div>
          </div>
          <h2 style="color:#0D1B2A;font-size:20px;font-weight:700;margin:0 0 8px;">Email Verification</h2>
          <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 24px;">
            Use the code below to verify your email address. It expires in <strong>5 minutes</strong>.
          </p>
          <div style="background:#F0F8FA;border:2px solid #007A8A;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#007A8A;font-family:monospace;">${code}</span>
          </div>
          <p style="color:#888;font-size:12px;line-height:1.5;margin:0;">
            If you did not request this code, please ignore this email. Do not share this code with anyone.
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
          <p style="color:#bbb;font-size:11px;text-align:center;margin:0;">
            GlimmoraTeam &mdash; AI-Governed Global Workforce Platform
          </p>
        </div>
      `,
    });

    if (sendError) {
      console.error("[send-email OTP] Resend error:", sendError);
      return NextResponse.json(
        { error: "SEND_FAILED", message: "Could not send verification email. Please try again." },
        { status: 500 },
      );
    }

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
