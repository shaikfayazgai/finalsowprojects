/**
 * POST /api/auth/oidc/[tenantSlug]/callback
 *
 * OIDC authorization-code callback (mock mode).
 *
 * Live mode: this endpoint receives `code` + `state` from the IdP redirect;
 * openid-client exchanges the code for tokens, validates the ID token
 * against the issuer's JWKS, and surfaces the claims set. Then
 * performSsoSignIn() runs the JIT-provision + Session-create + audit
 * pipeline (unchanged).
 *
 * Mock mode: the dev / smoke client POSTs JSON with `claims` (the
 * shape openid-client.tokenSet.claims() would normally return) plus a
 * mock `code`.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  exchangeOidcCode,
  loadTenantSsoConfig,
  performSsoSignIn,
  recordSsoSignatureFailure,
  SsoSignatureError,
  type OidcMockInput,
} from "@/lib/sso";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ tenantSlug: string }>;
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { tenantSlug } = await ctx.params;
  const loaded = await loadTenantSsoConfig(tenantSlug);
  if (!loaded || !loaded.config.enabled || loaded.config.kind !== "oidc") {
    return NextResponse.json(
      { error: "sso_not_configured" },
      { status: 404 },
    );
  }

  const ipAddress = req.headers.get("x-forwarded-for") ?? null;
  const userAgent = req.headers.get("user-agent") ?? null;

  let body: OidcMockInput;
  try {
    body = (await req.json()) as OidcMockInput;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  let assertion;
  try {
    assertion = exchangeOidcCode(loaded.config.oidc!, body);
  } catch (err) {
    if (err instanceof SsoSignatureError) {
      await recordSsoSignatureFailure({
        tenantId: loaded.tenantId,
        tenantSlug: loaded.tenantSlug,
        kind: "oidc",
        reason: err.message,
        ipAddress,
        userAgent,
      });
      return NextResponse.json(
        { error: "oidc_token_invalid" },
        { status: 401 },
      );
    }
    throw err;
  }

  const result = await performSsoSignIn({
    tenantId: loaded.tenantId,
    tenantSlug: loaded.tenantSlug,
    kind: "oidc",
    assertion,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({
    ok: true,
    userId: result.userId,
    sessionId: result.sessionId,
    jitProvisioned: result.jitProvisioned,
  });
}
