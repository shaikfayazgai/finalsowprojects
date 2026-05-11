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

    // Backend now signals first-login force-change via user.requiresPasswordChange === true
    // (no longer a 403). Frontend will then call /auth/login to get a token and redirect to
    // the change-password page.
    const requiresPasswordChange =
      userObj.requiresPasswordChange === true ||
      (userObj as { requires_password_change?: boolean }).requires_password_change === true;
    if (requiresPasswordChange) {
      return NextResponse.json({
        ok: true,
        passwordChangeRequired: true,
        redirectTo: "/auth/change-password",
      });
    }

    // The backend's /auth/validate endpoint currently only verifies password —
    // it never returns mfa_pending. So the checks above (which look for an
    // mfa-pending shape from /validate) never fire, and MFA-enabled users get
    // routed to the inline mfa-prompt step on the login page instead of the
    // TOTP entry step. To detect MFA state we *probe* /auth/login here. The
    // login response is read once for its `status` field; tokens are NOT
    // forwarded to the client (the actual session is still minted later by
    // the credentials signIn flow).
    try {
      const apiBase =
        process.env.GLIMMORA_API_URL ?? process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? "";
      if (apiBase) {
        const loginRes = await fetch(`${apiBase}/api/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: (email as string).trim().toLowerCase(),
            password,
          }),
          signal: AbortSignal.timeout(8000),
        });
        const loginData = (await loginRes.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        const loginStatus = loginData.status as string | undefined;
        const loginPendingToken = loginData.mfa_pending_token as string | undefined;
        const loginUser =
          (loginData.user as Record<string, unknown> | undefined) ?? {};
        const loginRole =
          (loginUser.role as string | undefined) ?? role ?? null;

        if (loginStatus === "mfa_required" && loginPendingToken) {
          return NextResponse.json({
            ok: true,
            mfaRequired: true,
            mfaPendingToken: loginPendingToken,
            user: {
              id: loginUser.id ?? "",
              email: loginUser.email ?? email,
              firstName: loginUser.firstName ?? "",
              lastName: loginUser.lastName ?? "",
              role: loginRole,
            },
          });
        }

        if (loginStatus === "mfa_setup_required" && loginPendingToken) {
          return NextResponse.json({
            ok: true,
            mfaSetupRequired: true,
            mfaSetupPendingToken: loginPendingToken,
            role: loginRole,
            user: {
              id: loginUser.id ?? "",
              email: loginUser.email ?? email,
              firstName: loginUser.firstName ?? "",
              lastName: loginUser.lastName ?? "",
              role: loginRole,
            },
          });
        }
      }
    } catch {
      /* probe failure is non-fatal — fall through to the original ok: true response */
    }

    return NextResponse.json({ ok: true, role });
  } catch (err) {
    if (err instanceof ApiError) {
      // Backend signals special 403s with a structured detail body
      // (e.g. MOBILE_2FA_REQUIRED or ACCOUNT_DISABLED). Surface the code
      // so the login page can route appropriately.
      if (err.status === 403) {
        let detail: { code?: string; message?: string } | undefined;
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
              };
            }
          } catch {
            /* not JSON — leave detail undefined */
          }
        }
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
