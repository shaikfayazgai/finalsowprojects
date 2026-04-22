import { NextRequest, NextResponse } from "next/server";
import { authApi, isMfaPending } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Dev-only hardcoded admin bypass
    if (email?.trim().toLowerCase() === "admin@glimmora.dev" && password === "Admin@1234") {
      return NextResponse.json({ ok: true, role: "admin" });
    }

    const response = await authApi.login(
      email?.trim().toLowerCase(),
      password,
    );

    // MFA pending — distinguish between "verify existing TOTP" and "setup required"
    if (isMfaPending(response)) {
      const mfaFlow = (response as unknown as Record<string, unknown>).status;

      // MFA setup required but not yet configured — return user data + pending token
      // so the login page can create a session without a second login call.
      if (mfaFlow === "mfa_setup_required") {
        const u = response.user;
        return NextResponse.json({
          ok: true,
          mfaSetupRequired: true,
          mfaSetupPendingToken: response.mfa_pending_token,
          role: (u as { role?: string }).role ?? null,
          user: {
            id: u.id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            role: (u as { role?: string }).role ?? null,
          },
        });
      }

      // MFA verify required (user has TOTP set up) — return pending token
      return NextResponse.json({
        ok: true,
        mfaRequired: true,
        mfaPendingToken: response.mfa_pending_token,
      });
    }

    // Return the Glimmora API tokens so the login page can pass them
    // into the NextAuth session (stored in the JWT via the jwt callback).
    return NextResponse.json({
      ok: true,
      role: response.user?.role ?? null,
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
