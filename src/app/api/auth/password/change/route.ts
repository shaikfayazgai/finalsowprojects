import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

export const runtime = "nodejs";

function verifyResetToken(token: string): { valid: boolean; email?: string; reason?: string } {
  try {
    const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "fallback-reset-secret";
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString());
    const { email, exp, sig } = decoded;

    if (!email || !exp || !sig) return { valid: false, reason: "Invalid token format" };
    if (Date.now() > exp) return { valid: false, reason: "Reset link has expired. Please request a new one." };

    const expected = createHmac("sha256", secret).update(`${email}:${exp}`).digest("hex");
    if (sig !== expected) return { valid: false, reason: "Invalid or tampered reset link." };

    return { valid: true, email };
  } catch {
    return { valid: false, reason: "Invalid reset link." };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, new_password } = body;

    if (!token || !new_password) {
      return NextResponse.json(
        { success: false, message: "Token and new password are required" },
        { status: 400 },
      );
    }

    // Verify our signed reset token
    const verification = verifyResetToken(token);
    if (!verification.valid) {
      return NextResponse.json(
        { success: false, message: verification.reason ?? "Invalid reset link." },
        { status: 400 },
      );
    }

    const backendUrl = process.env.GLIMMORA_API_URL ?? process.env.NEXT_PUBLIC_GLIMMORA_API_URL;

    // Use the token as Bearer auth — backend may accept reset tokens on this endpoint
    const backendRes = await fetch(`${backendUrl}/api/v1/auth/password/change`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ new_password }),
      signal: AbortSignal.timeout(10000),
    });

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      const message = data?.detail ?? data?.message ?? "Failed to reset password. Please try again.";
      return NextResponse.json({ success: false, message }, { status: backendRes.status });
    }

    return NextResponse.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    console.error("[password/change] error:", err);
    return NextResponse.json({ success: false, message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
