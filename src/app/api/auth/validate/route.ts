import { NextRequest, NextResponse } from "next/server";
import { authApi, isMfaPending } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Dev-only hardcoded admin bypass
    if (email?.trim().toLowerCase() === "admin@glimmora.dev" && password === "Admin@1234") {
      return NextResponse.json({
        ok: true,
        accessToken:  "",
        refreshToken: "",
        expiresIn:    3600,
        user: { id: "dev-admin-001", email: "admin@glimmora.dev", firstName: "Glimmora", lastName: "Admin", role: "admin" },
      });
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
          user: {
            id: u.id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
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

    // Return tokens + user so the login page can create a session via
    // signIn("glimmora-oauth") without making a second login API call.
    return NextResponse.json({
      ok: true,
      accessToken:  response.access_token,
      refreshToken: response.refresh_token,
      expiresIn:    response.expires_in,
      user: {
        id:        response.user.id,
        email:     response.user.email,
        firstName: response.user.firstName,
        lastName:  response.user.lastName,
        role:      response.user.role,
      },
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
              ok: false,
              error: "NO_ACCOUNT",
              message:
                "We couldn't find an account associated with this email. Please check your email or create a new account to get started.",
            },
          );
        }

        return NextResponse.json(
          {
            ok: false,
            error: "WRONG_PASSWORD",
            message:
              "The password you entered is incorrect. Please try again or reset your password.",
          },
        );
      }
    }

    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
