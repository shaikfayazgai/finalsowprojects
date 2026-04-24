import { NextRequest, NextResponse } from "next/server";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Pure credential check — does NOT issue tokens. The actual login and
    // session creation happens later when the user clicks "Skip for now"
    // (or completes MFA), which triggers signIn("credentials") → authApi.login().
    const raw = (await authApi.validateCredentials(
      email?.trim().toLowerCase(),
      password,
    )) as Record<string, unknown> | null;

    const r = raw ?? {};
    const userObj = (r.user as Record<string, unknown> | undefined) ?? {};
    const role =
      (userObj.role as string | undefined) ??
      (r.role as string | undefined) ??
      null;

    // Backend may return an MFA-pending shape even on /validate if the account
    // has 2FA enforced — forward that so the frontend routes to TOTP entry.
    const status = r.status as string | undefined;
    const mfaPendingToken = (r.mfa_pending_token as string | undefined) ?? (r.mfaPendingToken as string | undefined);

    if (status === "mfa_setup_required") {
      return NextResponse.json({
        ok: true,
        mfaSetupRequired: true,
        mfaSetupPendingToken: mfaPendingToken,
        role,
        user: {
          id: userObj.id ?? "",
          email: userObj.email ?? email,
          firstName: userObj.firstName ?? "",
          lastName: userObj.lastName ?? "",
          role,
        },
      });
    }

    if (status === "mfa_pending" || mfaPendingToken) {
      return NextResponse.json({
        ok: true,
        mfaRequired: true,
        mfaPendingToken,
      });
    }

    return NextResponse.json({ ok: true, role });
  } catch (err) {
    if (err instanceof ApiError) {
      // Backend gates login on phone-based SMS 2FA with a 403 carrying a
      // JSON body like {"code":"MOBILE_2FA_REQUIRED","message":"…"}. Parse it
      // and surface a dedicated code so the login page can route the user
      // to phone verification instead of showing a generic 500.
      if (err.status === 403) {
        let code = "FORBIDDEN";
        let message = err.message;
        try {
          const parsed = JSON.parse(err.message);
          if (typeof parsed?.code === "string") code = parsed.code;
          if (typeof parsed?.message === "string") message = parsed.message;
        } catch {
          /* message wasn't JSON — fall back to the raw string */
        }
        return NextResponse.json({ ok: false, error: code, message });
      }

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

      // ApiError with an unexpected status — surface enough to debug without
      // leaking the upstream body to the client.
      console.error(
        "[/api/auth/validate] upstream ApiError",
        { status: err.status, message: err.message },
      );
    } else {
      console.error("[/api/auth/validate] unexpected error", err);
    }

    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
