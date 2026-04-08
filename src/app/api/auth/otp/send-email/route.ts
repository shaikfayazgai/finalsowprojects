import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import crypto from "crypto";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

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

    const from = process.env.EMAIL_FROM ?? `GlimmoraTeam <${process.env.GMAIL_USER}>`;

    console.log(`[send-email OTP] Sending code to: ${email}`);
    try {
      await transporter.sendMail({
        from,
        to: email,
        subject: "Your GlimmoraTeam verification code",
        html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#F0EDE9;font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0EDE9;padding:40px 16px;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.10);">

                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#005F6B 0%,#007A8A 100%);padding:32px 40px 0;">
                    <div style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.3px;margin-bottom:4px;">GlimmoraTeam</div>
                    <div style="color:rgba(255,255,255,0.7);font-size:11px;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:16px;">AI-Governed Global Workforce Platform</div>
                    <div style="display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:6px;padding:5px 12px;margin-bottom:32px;">
                      <span style="color:#A7F3D0;font-size:11px;font-weight:700;letter-spacing:0.08em;">🔐 EMAIL VERIFICATION</span>
                    </div>
                  </td>
                </tr>
                <!-- Header arc -->
                <tr><td style="background:linear-gradient(135deg,#005F6B 0%,#007A8A 100%);padding:0;">
                  <div style="height:28px;background:#fff;border-radius:50% 50% 0 0/100% 100% 0 0;"></div>
                </td></tr>

                <!-- Hero -->
                <tr>
                  <td style="padding:8px 40px 20px;text-align:center;">
                    <div style="display:inline-block;width:72px;height:72px;border-radius:50%;background:#E6F4F5;border:3px solid #B3DEE2;text-align:center;line-height:72px;margin-bottom:16px;font-size:32px;">🔑</div>
                    <div style="font-size:26px;font-weight:800;color:#0D1B2A;letter-spacing:-0.5px;margin-bottom:8px;">Verify Your Email</div>
                    <div style="font-size:15px;color:#6b7280;">Use the code below to complete verification.</div>
                  </td>
                </tr>

                <!-- Code -->
                <tr>
                  <td style="padding:0 40px 32px;">
                    <p style="font-size:15px;line-height:1.7;color:#374151;margin:0 0 20px;">
                      Your one-time verification code is valid for <strong>5 minutes</strong>. Do not share this code with anyone.
                    </p>

                    <!-- OTP box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                      <tr>
                        <td align="center" style="background:linear-gradient(135deg,#E6F4F5,#F0FAFA);border:2px solid #007A8A;border-radius:14px;padding:28px 20px;">
                          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#007A8A;margin-bottom:12px;">Your Verification Code</div>
                          <div style="font-size:42px;font-weight:800;letter-spacing:14px;color:#0D1B2A;font-family:'Courier New',Courier,monospace;">${code}</div>
                          <div style="font-size:12px;color:#6b7280;margin-top:12px;">Expires in 5 minutes</div>
                        </td>
                      </tr>
                    </table>

                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8F3;border:1px solid #F0DDD0;border-radius:10px;margin:0 0 8px;">
                      <tr>
                        <td style="padding:14px 20px;">
                          <div style="font-size:13px;font-weight:700;color:#92400E;margin-bottom:4px;">⚠ Security Notice</div>
                          <div style="font-size:13px;color:#374151;line-height:1.5;">If you did not request this code, please ignore this email. Never share your verification code with anyone, including GlimmoraTeam support.</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#F9F7F5;border-top:1px solid #EDE8E3;padding:20px 40px;">
                    <div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:4px;">GlimmoraTeam</div>
                    <div style="font-size:11px;color:#9ca3af;line-height:1.5;">You received this because you requested email verification on GlimmoraTeam.</div>
                  </td>
                </tr>

              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
      });
      console.log(`[send-email OTP] Sent successfully to: ${email}`);
    } catch (sendErr) {
      console.error("[send-email OTP] send error:", sendErr);
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
