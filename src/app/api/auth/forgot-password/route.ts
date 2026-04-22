import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { sendEmail, buildEmailHtml } from "@/lib/email";
import { getBaseUrl } from "@/lib/utils/base-url";

export const runtime = "nodejs";

function generateResetToken(email: string): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "fallback-reset-secret";
  const exp = Date.now() + 30 * 60 * 1000; // 30 minutes
  const payload = `${email}:${exp}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(JSON.stringify({ email, exp, sig })).toString("base64url");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Fire backend call in background (best-effort, 8s timeout)
    const backendUrl = process.env.GLIMMORA_API_URL ?? process.env.NEXT_PUBLIC_GLIMMORA_API_URL;
    if (backendUrl) {
      fetch(`${backendUrl}/api/v1/auth/password/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
        signal: AbortSignal.timeout(8000),
      }).catch(() => {});
    }

    // Generate a signed reset token and send our own email
    const token = generateResetToken(normalizedEmail);
    const baseUrl = getBaseUrl();
    const resetLink = `${baseUrl}/auth/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(normalizedEmail)}`;

    const bodyHtml = `
      <h2 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 8px;">Reset Your Password</h2>
      <p style="color:#6b7280;margin:0 0 24px;">
        You requested a password reset for your GlimmoraTeam account associated with
        <strong style="color:#1a1a1a;">${normalizedEmail}</strong>.
      </p>
      <p style="margin:0 0 24px;">Click the button below to set a new password. This link expires in <strong>30 minutes</strong>.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${resetLink}"
           style="display:inline-block;background:#A67763;color:#fff;font-size:15px;font-weight:700;
                  padding:14px 36px;border-radius:10px;text-decoration:none;letter-spacing:0.01em;">
          Reset Password
        </a>
      </div>
      <p style="font-size:13px;color:#9ca3af;margin:0 0 8px;">
        Or copy and paste this link into your browser:
      </p>
      <p style="font-size:12px;color:#A67763;word-break:break-all;margin:0 0 24px;">
        <a href="${resetLink}" style="color:#A67763;">${resetLink}</a>
      </p>
      <p style="font-size:13px;color:#9ca3af;margin:0;">
        If you did not request this, you can safely ignore this email. Your password will not change.
      </p>
    `;

    const html = buildEmailHtml({
      bodyHtml,
      headerColor: "#A67763",
      footerText: "© GlimmoraTeam · AI-Governed Global Workforce Platform · This is an automated message.",
    });

    const emailResult = await sendEmail({
      to: normalizedEmail,
      subject: "Reset your GlimmoraTeam password",
      html,
    });

    if (!emailResult.success) {
      console.error("[forgot-password] email send failed for:", normalizedEmail, "detail:", emailResult.error);
      return NextResponse.json(
        {
          success: false,
          message: "Email send failed.",
          detail: emailResult.error,
        },
        { status: 500 },
      );
    }

    console.log("[forgot-password] reset email sent to:", normalizedEmail, "messageId:", emailResult.messageId);
    return NextResponse.json({
      success: true,
      message: "If an account exists for this email, a reset link has been sent.",
    });
  } catch (err) {
    console.error("[forgot-password] unexpected error:", err);
    return NextResponse.json({
      success: true,
      message: "If an account exists for this email, a reset link has been sent.",
    });
  }
}
