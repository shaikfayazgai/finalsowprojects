import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/auth/oauth/authorize?provider=google|microsoft&redirectAfter=...&role=...
 *
 * Server-side redirect to the Glimmora OAuth authorize endpoint.
 * Builds the authorize URL using the server-only GLIMMORA_API_URL env var,
 * encodes redirectAfter + role into the state param, then 302-redirects.
 *
 * Used by the login and register pages (client-side) to avoid needing
 * NEXT_PUBLIC_GLIMMORA_API_URL.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider");
  const redirectAfter = searchParams.get("redirectAfter") ?? "/enterprise/dashboard";
  const role = searchParams.get("role") ?? "enterprise";

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

  // Encode callbackUrl inside state so Google passes it back to the FastAPI
  // callback unchanged — the FastAPI then reads it to know where to redirect.
  const state = Buffer.from(
    JSON.stringify({ redirectAfter, role, callbackUrl: appCallbackUrl }),
  ).toString("base64");
  const authorizeUrl = `${baseUrl}/api/v1/auth/oauth/${provider}/authorize?state=${encodeURIComponent(state)}`;

  return NextResponse.redirect(authorizeUrl);
}
