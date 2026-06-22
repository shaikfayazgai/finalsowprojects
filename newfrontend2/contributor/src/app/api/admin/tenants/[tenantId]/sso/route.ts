/**
 * POST /api/admin/tenants/[tenantId]/sso
 *
 * Platform-admin endpoint to set/update a tenant's SSO config. Body is
 * the TenantSsoConfig shape (see src/lib/sso/types.ts). Audit-emits
 * `tenant.sso.configure`.
 *
 * Requires `admin` or `super_admin` role (`plat.admin` portal role).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { upsertTenantSsoConfig, SsoConfigError } from "@/lib/sso";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ tenantId: string }>;
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const auth = await requireRole(["admin", "super_admin"]);
  if (auth instanceof NextResponse) return auth;

  const { tenantId } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    const result = await upsertTenantSsoConfig({
      tenantId,
      config: body,
      actorUserId: auth.userId,
      actorPortalRole: "plat.admin",
      actorSessionId:
        (auth.session.user as { sessionId?: string }).sessionId ?? null,
      ipAddress: req.headers.get("x-forwarded-for") ?? null,
      userAgent: req.headers.get("user-agent") ?? null,
    });
    return NextResponse.json({
      ok: true,
      tenantId: result.tenantId,
      kind: result.config.kind,
      enabled: result.config.enabled,
    });
  } catch (err) {
    if (err instanceof SsoConfigError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: 400 },
      );
    }
    if ((err as { code?: string }).code === "tenant_not_found") {
      return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
    }
    throw err;
  }
}
