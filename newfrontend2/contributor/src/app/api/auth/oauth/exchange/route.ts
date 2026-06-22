import { NextRequest, NextResponse } from "next/server";
import { authApi } from "@/lib/api/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/auth/oauth/exchange
 *
 * Server-side token exchange — calls the Glimmora API's OAuth callback
 * endpoint with the authorization code received from the OAuth provider.
 * Used by the client-side /auth/oauth/callback page (Case B).
 */
export async function POST(req: NextRequest) {
  try {
    const { code, provider, state } = await req.json() as {
      code: string;
      provider: "google" | "microsoft";
      state?: string;
    };

    if (!code || !provider) {
      return NextResponse.json({ error: "Missing code or provider" }, { status: 400 });
    }

    const data = await authApi.exchangeOAuthCode(provider, code, state);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Token exchange failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
