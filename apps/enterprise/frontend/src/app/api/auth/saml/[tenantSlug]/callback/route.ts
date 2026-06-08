/**
 * POST /api/auth/saml/[tenantSlug]/callback
 *
 * SAML IdP-initiated POST binding (mock mode).
 *
 * Live mode: this endpoint receives a SAMLResponse form field from the
 * IdP; the SAML library verifies the signature against
 * tenant.ssoConfig.saml.certificate, extracts attributes via the
 * attributeMap, and produces an SsoAssertion. Then performSsoSignIn()
 * runs the JIT-provision + Session-create + audit pipeline (unchanged).
 *
 * Mock mode: the dev / smoke client POSTs JSON with the pre-parsed
 * attributes. The provider gateway still applies the attributeMap
 * lookup so the dev path exercises the same field resolution the live
 * library would do.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  loadTenantSsoConfig,
  performSsoSignIn,
  recordSsoSignatureFailure,
  verifySamlResponse,
  SsoSignatureError,
  type SamlMockInput,
} from "@/lib/sso";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ tenantSlug: string }>;
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { tenantSlug } = await ctx.params;
  const loaded = await loadTenantSsoConfig(tenantSlug);
  if (!loaded || !loaded.config.enabled || loaded.config.kind !== "saml") {
    return NextResponse.json(
      { error: "sso_not_configured" },
      { status: 404 },
    );
  }

  const ipAddress = req.headers.get("x-forwarded-for") ?? null;
  const userAgent = req.headers.get("user-agent") ?? null;

  // Mock body shape — see provider.ts SamlMockInput.
  let body: SamlMockInput;
  try {
    body = (await req.json()) as SamlMockInput;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  let assertion;
  try {
    assertion = verifySamlResponse(loaded.config.saml!, body);
  } catch (err) {
    if (err instanceof SsoSignatureError) {
      await recordSsoSignatureFailure({
        tenantId: loaded.tenantId,
        tenantSlug: loaded.tenantSlug,
        kind: "saml",
        reason: err.message,
        ipAddress,
        userAgent,
      });
      return NextResponse.json(
        { error: "saml_signature_invalid" },
        { status: 401 },
      );
    }
    throw err;
  }

  const result = await performSsoSignIn({
    tenantId: loaded.tenantId,
    tenantSlug: loaded.tenantSlug,
    kind: "saml",
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
