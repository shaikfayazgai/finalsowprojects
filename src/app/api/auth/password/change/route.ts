import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

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

    const backendUrl = process.env.GLIMMORA_API_URL ?? process.env.NEXT_PUBLIC_GLIMMORA_API_URL;

    // The reset token from the email is used as a Bearer token.
    // current_password is omitted since this is a reset flow (no old password known).
    const backendRes = await fetch(`${backendUrl}/api/v1/auth/password/change`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ new_password }),
    });

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      const message = data?.detail ?? data?.message ?? "Failed to reset password. The link may have expired.";
      return NextResponse.json({ success: false, message }, { status: backendRes.status });
    }

    return NextResponse.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    console.error("[password/change] error:", err);
    return NextResponse.json({ success: false, message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
