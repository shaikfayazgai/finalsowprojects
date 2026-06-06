import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";

// Pass through structured backend errors so the page can map detail.code → user message.
function passthroughError(status: number, data: unknown) {
  const detail = (data as { detail?: { code?: string; message?: string } | string } | undefined)?.detail;
  if (detail && typeof detail === "object") {
    return NextResponse.json(
      {
        success: false,
        code: detail.code,
        message: detail.message ?? "Operation failed.",
      },
      { status },
    );
  }
  const fallback = typeof detail === "string"
    ? detail
    : (data as { message?: string } | undefined)?.message ?? "Operation failed.";
  return NextResponse.json({ success: false, message: fallback }, { status });
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

    const backendUrl = process.env.GLIMMORA_API_URL ?? process.env.NEXT_PUBLIC_GLIMMORA_API_URL;
    if (!backendUrl) {
      console.error("[password/change] GLIMMORA_API_URL not configured");
      return NextResponse.json(
        { success: false, message: "Server configuration error. Please contact support." },
        { status: 500 },
      );
    }

    // Forgot-password reset flow — backend now owns token issuance and verification.
    // We are a dumb pass-through: forward the server-issued token without inspecting it.
    if (token) {
      const backendRes = await fetch(`${backendUrl}/api/v1/auth/password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          new_password,
          confirmPassword: confirmPassword ?? new_password,
        }),
        signal: AbortSignal.timeout(10000),
      });
      const data = await backendRes.json().catch(() => ({}));
      if (!backendRes.ok) return passthroughError(backendRes.status, data);
      return NextResponse.json({ success: true, message: "Password reset successfully" });
    }

    // Logged-in change-password flow — uses session bearer token.
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated. Please log in to change your password." },
        { status: 401 },
      );
    }

    const accessToken =
      (session as { accessToken?: string }).accessToken ??
      (session as { glimmoraAccessToken?: string }).glimmoraAccessToken;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: "Authentication token missing. Please log in again." },
        { status: 401 },
      );
    }

    const backendRes = await fetch(`${backendUrl}/api/v1/auth/password/change`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        new_password,
        confirmPassword: confirmPassword ?? new_password,
        ...(old_password && { old_password }),
      }),
      signal: AbortSignal.timeout(10000),
    });

    const data = await backendRes.json().catch(() => ({}));
    if (!backendRes.ok) return passthroughError(backendRes.status, data);
    return NextResponse.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("[password/change] error:", err);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
