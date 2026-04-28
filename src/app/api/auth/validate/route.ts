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
      // Backend signals special 403s with a structured detail body.
      // Read it from err.body first; fall back to JSON-parsing err.message
      // for older ApiErrors that don't carry the body.
      if (err.status === 403) {
        let detail: { code?: string; message?: string; redirect_to?: string } | undefined;
        const bodyDetail = (err.body as { detail?: typeof detail } | undefined)?.detail;
        if (bodyDetail) {
          detail = bodyDetail;
        } else {
          try {
            const parsed = JSON.parse(err.message);
            if (parsed && typeof parsed === "object") {
              detail = {
                code: typeof parsed.code === "string" ? parsed.code : undefined,
                message: typeof parsed.message === "string" ? parsed.message : undefined,
                redirect_to: typeof parsed.redirect_to === "string" ? parsed.redirect_to : undefined,
              };
            }
          } catch {
            /* not JSON — leave detail undefined */
          }
        }

        // First-login temp password → tell the login page to route to /auth/change-password.
        if (detail?.code === "PASSWORD_CHANGE_REQUIRED") {
          return NextResponse.json({
            ok: true,
            passwordChangeRequired: true,
            redirectTo: detail.redirect_to ?? "/auth/change-password",
            message: detail.message ?? "Temporary password must be changed before login.",
          });
        }

        // Any other 403 (e.g. MOBILE_2FA_REQUIRED) → surface code so the page can route.
        const code = detail?.code ?? "FORBIDDEN";
        const message = detail?.message ?? err.message;
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
