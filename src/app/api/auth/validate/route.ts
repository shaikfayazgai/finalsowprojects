import { NextRequest, NextResponse } from "next/server";
import { authApi, isMfaPending } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const response = await authApi.login(
      email?.trim().toLowerCase(),
      password,
    );

    // MFA required — return the pending token so the login page can show the TOTP step
    if (isMfaPending(response)) {
      return NextResponse.json({
        ok: true,
        mfaRequired: true,
        mfaPendingToken: response.mfa_pending_token,
      });
    }

    return NextResponse.json({ ok: true });
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
