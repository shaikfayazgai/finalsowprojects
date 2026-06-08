import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/auth/oauth/authorize?provider=google|microsoft&redirectAfter=...&role=...&intent=login|register
 *
 * Server-side redirect to the Glimmora OAuth authorize endpoint. Encodes
 * redirectAfter + role + callbackUrl + intent into the state param, then
 * 302-redirects.
 *
 * `intent` is forwarded to the backend so it can:
 *   - intent=login + user does not exist  → return OAUTH_NO_ACCOUNT
 *   - intent=login + user exists          → SKIP role-conflict check (the
 *                                            login page's `role` is just a UI
 *                                            hint; trust the existing user)
 *   - intent=register + user exists       → return OAUTH_ALREADY_REGISTERED
 *
 * Without intent, the backend falls back to legacy strict-role behaviour and
 * raises EMAIL_ROLE_CONFLICT for cross-role logins. That's the bug this fixes.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider");
  const redirectAfter = searchParams.get("redirectAfter") ?? "/auth/redirect";
  const role = searchParams.get("role") ?? "";
  const rawIntent = (searchParams.get("intent") ?? "").toLowerCase();
  const intent: "login" | "register" | undefined =
    rawIntent === "login" || rawIntent === "register" ? rawIntent : undefined;

  if (provider !== "google" && provider !== "microsoft") {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  const baseUrl = process.env.GLIMMORA_API_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { error: "GLIMMORA_API_URL is not configured" },
      { status: 500 },
    );
  }

  // Derive the app origin so Glimmora knows where to redirect the browser after
  // it processes the Google/Microsoft callback (its own callback URL is locked to
  // glimmora-api.onrender.com, so it must redirect back to us explicitly).
  const requestUrl = new URL(req.url);
  const appOrigin = process.env.NEXTAUTH_URL
    ? new URL(process.env.NEXTAUTH_URL).origin
    : `${requestUrl.protocol}//${requestUrl.host}`;
  const appCallbackUrl = `${appOrigin}/auth/oauth/callback`;

  // Encode callbackUrl + intent inside state so Google passes it back to the
  // FastAPI callback unchanged — the FastAPI then reads it to know where to
  // redirect, and which intent rule to apply.
  const envelope: Record<string, string> = {
    redirectAfter,
    role,
    callbackUrl: appCallbackUrl,
  };
  if (intent) envelope.intent = intent;
  const state = Buffer.from(JSON.stringify(envelope)).toString("base64");
  const authorizeUrl = `${baseUrl}/api/v1/auth/oauth/${provider}/authorize?state=${encodeURIComponent(state)}`;

  return NextResponse.redirect(authorizeUrl);
}
