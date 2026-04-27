import { NextRequest, NextResponse } from "next/server";
import { authApi, isMfaPending } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Dev-only hardcoded admin bypass
    if (email?.trim().toLowerCase() === "admin@glimmora.dev" && password === "Admin@1234") {
      return NextResponse.json({ ok: true });
    }

    const response = await authApi.login(
      email?.trim().toLowerCase(),
      password,
    );

    const raw = response as Record<string, unknown>;
    const status = typeof raw.status === "string" ? raw.status : "";
    const mfaToken =
      typeof raw.mfa_pending_token === "string"
        ? raw.mfa_pending_token
        : typeof raw.mfaPendingToken === "string"
          ? raw.mfaPendingToken
          : "";

    // First-time MFA enrollment — backend uses status mfa_setup_required (not mfa_pending).
    if (status === "mfa_setup_required" && mfaToken) {
      const u = raw.user as
        | { id?: string; email?: string; firstName?: string; lastName?: string }
        | undefined;
      return NextResponse.json({
        ok: true,
        mfaSetupRequired: true,
        mfaSetupPendingToken: mfaToken,
        user: {
          id: u?.id ?? "",
          email: u?.email ?? "",
          firstName: u?.firstName ?? "",
          lastName: u?.lastName ?? "",
        },
      });
    }

    // MFA verify required (user already has TOTP) — return pending token for login page.
    if (isMfaPending(response)) {
      return NextResponse.json({
        ok: true,
        mfaRequired: true,
        mfaPendingToken: mfaToken || (response as { mfa_pending_token?: string }).mfa_pending_token,
      });
    }

    // Return the Glimmora API tokens so the login page can pass them
    // into the NextAuth session (stored in the JWT via the jwt callback).
    return NextResponse.json({
      ok: true,
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresIn: response.expires_in,
    });
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401 || err.status === 404) {
        const isNotFound =
          err.message.toLowerCase().includes("not found") ||
          err.message.toLowerCase().includes("no account") ||
          err.message.toLowerCase().includes("does not exist");

        if (isNotFound) {
          return NextResponse.json(
            {
              error: "NO_ACCOUNT",
              message:
                "We couldn't find an account associated with this email. Please check your email or create a new account to get started.",
            },
            { status: 401 },
          );
        }

        return NextResponse.json(
          {
            error: "WRONG_PASSWORD",
            message:
              "The password you entered is incorrect. Please try again or reset your password.",
          },
          { status: 401 },
        );
      }
    }

    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
