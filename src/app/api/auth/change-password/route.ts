import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, currentPassword, newPassword, confirmPassword } = body ?? {};

    if (!email || !currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, message: "Email, current password, new password, and confirm password are required." },
        { status: 400 },
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: "New password and confirm password do not match." },
        { status: 400 },
      );
    }

    const backendUrl = process.env.GLIMMORA_API_URL ?? process.env.NEXT_PUBLIC_GLIMMORA_API_URL;

    const backendRes = await fetch(`${backendUrl}/api/v1/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, currentPassword, newPassword, confirmPassword }),
      signal: AbortSignal.timeout(10000),
    });

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      const detail = data?.detail;
      const message =
        typeof detail === "string" ? detail :
        typeof detail?.message === "string" ? detail.message :
        typeof data?.message === "string" ? data.message :
        "Failed to change password. Please try again.";
      return NextResponse.json({ success: false, message }, { status: backendRes.status });
    }

    return NextResponse.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("[auth/change-password] error:", err);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
