import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { auth } from "@/auth";

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
    const { token, new_password, confirmPassword, old_password } = body;

    if (!new_password) {
      return NextResponse.json(
        { success: false, message: "New password is required" },
        { status: 400 },
      );
    }

    // Validate that new_password and confirmPassword match
    if (confirmPassword && new_password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: "Passwords do not match" },
        { status: 400 },
      );
    }

    const backendUrl = process.env.GLIMMORA_API_URL ?? process.env.NEXT_PUBLIC_GLIMMORA_API_URL;

    if (!backendUrl) {
      console.error("[password/change] GLIMMORA_API_URL not configured");
      return NextResponse.json(
        { success: false, message: "Server configuration error. Please contact support." },
        { status: 500 }
      );
    }

    // Check if this is a password reset (with reset token) or change password (while logged in)
    if (token) {
      // Password reset flow — verify the reset token
      const verification = verifyResetToken(token);
      if (!verification.valid) {
        return NextResponse.json(
          { success: false, message: verification.reason ?? "Invalid reset link." },
          { status: 400 },
        );
      }

      // Send password reset with reset token to backend
      const backendRes = await fetch(`${backendUrl}/api/v1/auth/password/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          new_password,
          confirmPassword: confirmPassword || new_password,
        }),
        signal: AbortSignal.timeout(10000),
      });

      const data = await backendRes.json().catch(() => ({}));

      if (!backendRes.ok) {
        console.error("[password/change] Reset failed:", {
          status: backendRes.status,
          message: data?.detail ?? data?.message,
        });
        const message = data?.detail ?? data?.message ?? "Failed to reset password. Please try again.";
        return NextResponse.json({ success: false, message }, { status: backendRes.status });
      }

      return NextResponse.json({ success: true, message: "Password reset successfully" });
    } else {
      // Change password flow — use current session for authentication
      const session = await auth();

      if (!session?.user) {
        return NextResponse.json(
          { success: false, message: "Not authenticated. Please log in to change your password." },
          { status: 401 },
        );
      }

      // Get the access token from session
      const accessToken = (session as any).accessToken || (session as any).glimmoraAccessToken;

      if (!accessToken) {
        return NextResponse.json(
          { success: false, message: "Authentication token missing. Please log in again." },
          { status: 401 },
        );
      }

      // Send password change request with session authentication
      const backendRes = await fetch(`${backendUrl}/api/v1/auth/password/change`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          new_password,
          confirmPassword: confirmPassword || new_password,
          ...(old_password && { old_password }), // Include old password if provided
        }),
        signal: AbortSignal.timeout(10000),
      });

      const data = await backendRes.json().catch(() => ({}));

      if (!backendRes.ok) {
        console.error("[password/change] Change failed:", {
          status: backendRes.status,
          message: data?.detail ?? data?.message,
        });
        const message = data?.detail ?? data?.message ?? "Failed to change password. Please try again.";
        return NextResponse.json({ success: false, message }, { status: backendRes.status });
      }

      return NextResponse.json({ success: true, message: "Password changed successfully" });
    }
  } catch (err) {
    console.error("[password/change] error:", err);
    return NextResponse.json({ success: false, message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
