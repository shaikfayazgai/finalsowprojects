/**
 * Composed request context — the helper every API route should use to
 * stand up the Phase 1 foundation chain in one call.
 *
 *   const ctx = await requireTenantRequest({ allowedRoles: ["enterprise"] });
 *   if (ctx instanceof NextResponse) return ctx;
 *
 *   await ctx.withTx(async (tx) => {
 *     await tx.acceptanceDecision.create({ data: { ..., tenantId: ctx.tenant.id } });
 *     await ctx.audit({
 *       action: "task.accept",
 *       resource: { type: "task", id: taskId },
 *       payload: { ... },
 *     }, { tx });
 *   });
 *
 * What it does in order:
 *   1. auth()                       — read NextAuth session
 *   2. validateSession()            — durable Session row check
 *   3. role gate                    — match against allowedRoles
 *   4. resolveTenantForUser()       — pull Tenant by User.tenantId
 *   5. tenantAccessibility()        — reject blocked/closed tenants
 *   6. capture ipAddress/userAgent  — for audit + Session lastActiveAt
 *   7. wrap audit() with actor pre-filled
 *   8. provide withTx() that binds app.tenant_id for RLS
 *
 * Two flavors:
 *   - requireRequest         — auth + role; tenant is optional (null OK)
 *   - requireTenantRequest   — same + requires a tenant (fails if user has none)
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type { Session } from "next-auth";
import type { Prisma, Tenant } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { validateSession } from "@/lib/session";
import {
  resolveTenantForUser,
  tenantAccessibility,
  setTransactionTenant,
  type TenantAccessibility,
} from "@/lib/tenant";
import { auditEmit, type AuditEventInput, type EmittedAuditEvent } from "@/lib/audit";
import type { Role } from "@/lib/auth/require-role";

/* ─────────────────────────── Types ─────────────────────────── */

interface BaseContext {
  session: Session;
  userId: string;
  email: string;
  role: Role;
  /** Durable Session row id (null when degraded auth path). */
  sessionId: string | null;
  ipAddress: string | null;
  userAgent: string | null;

  /**
   * Audit emit pre-filled with the request's actor identity.
   * Caller supplies action/resource/payload/severity/before/after only.
   */
  audit: (
    event: Omit<AuditEventInput, "actor">,
    options?: { tx?: Prisma.TransactionClient },
  ) => Promise<EmittedAuditEvent>;
}

export interface AuthenticatedRequestContext extends BaseContext {
  /** Resolved tenant (null for cross-tenant users). */
  tenant: Tenant | null;

  /**
   * Run a function inside an interactive Prisma transaction. If a
   * tenant is in context, `app.tenant_id` is bound at the start of
   * the transaction so RLS-enabled tables enforce scope.
   */
  withTx: <T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) => Promise<T>;
}

export interface TenantBoundRequestContext extends BaseContext {
  /** Guaranteed non-null tenant. */
  tenant: Tenant;
  /** Tenant accessibility classification (open/admin_only). */
  tenantAccess: TenantAccessibility;
  withTx: <T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) => Promise<T>;
}

export interface RequireRequestOptions {
  /** Empty/omitted = any authenticated role allowed. */
  allowedRoles?: Role[];
}

/* ─────────────────── Internal: build base context ─────────────────── */

function unauthenticated(reason?: string): NextResponse {
  return NextResponse.json(
    { error: "unauthenticated", reason },
    { status: 401 },
  );
}

function forbidden(reason?: string): NextResponse {
  return NextResponse.json(
    { error: "forbidden", reason },
    { status: 403 },
  );
}

async function buildBaseContext(
  options: RequireRequestOptions,
): Promise<
  | {
      session: Session;
      userId: string;
      email: string;
      role: Role;
      sessionId: string | null;
      ipAddress: string | null;
      userAgent: string | null;
    }
  | NextResponse
> {
  const session = (await auth()) as Session | null;
  if (!session?.user) return unauthenticated();

  const userId = (session.user as { id?: string }).id ?? "";
  const role = (session.user as { role?: Role }).role;
  const email = session.user.email ?? "";
  if (!userId || !role) return unauthenticated("missing_role");

  // Capture request context headers for audit + downstream
  const reqHeaders = await headers();
  const ipAddress =
    reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    reqHeaders.get("x-real-ip") ??
    null;
  const userAgent = reqHeaders.get("user-agent") ?? null;

  // Durable Session validation (when wired). Graceful degrade if missing.
  const sessionId =
    (session.user as { sessionId?: string }).sessionId ?? null;
  if (sessionId) {
    const check = await validateSession(sessionId, {
      updateLastActive: false,
    });
    if (!check.valid) {
      // Audit attempted access with invalid session, then 401.
      await auditEmit({
        tenantId: null,
        actor: {
          userId,
          portalRole: role,
          sessionId,
          ipAddress,
          userAgent,
        },
        action: "auth.session.invalid_access",
        resource: { type: "session", id: sessionId },
        payload: { reason: check.reason },
        severity: "warning",
      });
      return unauthenticated(check.reason);
    }
  }

  // Role gate
  if (options.allowedRoles && options.allowedRoles.length > 0) {
    if (!options.allowedRoles.includes(role)) {
      return forbidden("insufficient_role");
    }
  }

  return { session, userId, email, role, sessionId, ipAddress, userAgent };
}

function buildAuditFn(args: {
  userId: string;
  role: Role;
  sessionId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  tenantIdForDefault: string | null;
}): BaseContext["audit"] {
  return (event, options) =>
    auditEmit(
      {
        // Default tenant scope to the resolved tenant; callers can
        // override (e.g., emit a platform-internal event by passing null).
        tenantId:
          event.tenantId === undefined ? args.tenantIdForDefault : event.tenantId,
        actor: {
          userId: args.userId,
          portalRole: args.role,
          sessionId: args.sessionId,
          ipAddress: args.ipAddress,
          userAgent: args.userAgent,
        },
        ...event,
      },
      options,
    );
}

function buildWithTx(tenantId: string | null) {
  return async <T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> => {
    return prisma.$transaction(async (tx) => {
      if (tenantId) await setTransactionTenant(tx, tenantId);
      return fn(tx);
    });
  };
}

/* ──────────────────────── Public: requireRequest ──────────────────── */

/**
 * Standard authenticated handler context. Tenant is optional — for
 * cross-tenant users (contributor, mentor, plat.*) tenant is null.
 *
 * Use this for endpoints like `/api/me`, `/api/sessions`, or any
 * surface that operates on the user's identity rather than on a
 * tenant resource.
 */
export async function requireRequest(
  options: RequireRequestOptions = {},
): Promise<AuthenticatedRequestContext | NextResponse> {
  const base = await buildBaseContext(options);
  if (base instanceof NextResponse) return base;

  // Resolve tenant; null is OK for cross-tenant users.
  const tenantCtx = await resolveTenantForUser(base.userId);
  const tenant = tenantCtx?.tenant ?? null;

  return {
    ...base,
    tenant,
    audit: buildAuditFn({
      userId: base.userId,
      role: base.role,
      sessionId: base.sessionId,
      ipAddress: base.ipAddress,
      userAgent: base.userAgent,
      tenantIdForDefault: tenant?.id ?? null,
    }),
    withTx: buildWithTx(tenant?.id ?? null),
  };
}

/* ────────────────── Public: requireTenantRequest ──────────────────── */

/**
 * Same as `requireRequest` but requires a tenant. Returns 403 if the
 * user has no tenantId (i.e., cross-tenant users hitting a tenant-only
 * endpoint). Returns 403 if the tenant is paused/closed.
 *
 * Use this for endpoints like `/api/enterprise/acceptance/[taskId]`,
 * `/api/sow/...`, billing — any tenant-resource handler.
 *
 * For paths where a cross-tenant operator (admin, mentor) acts within
 * a specific tenant via URL slug, build a separate variant that
 * accepts a slug param. Phase 1 doesn't need that yet.
 */
export async function requireTenantRequest(
  options: RequireRequestOptions = {},
): Promise<TenantBoundRequestContext | NextResponse> {
  const base = await buildBaseContext(options);
  if (base instanceof NextResponse) return base;

  const tenantCtx = await resolveTenantForUser(base.userId);
  if (!tenantCtx) {
    return forbidden("no_tenant_context");
  }

  const access = tenantAccessibility(tenantCtx.tenant);
  if (access === "blocked") {
    return forbidden("tenant_paused");
  }
  if (access === "closed") {
    return forbidden("tenant_closed");
  }
  // 'admin_only' (provisioning) and 'open' both proceed; route-specific
  // policy decides whether admin_only is acceptable for this action.

  return {
    ...base,
    tenant: tenantCtx.tenant,
    tenantAccess: access,
    audit: buildAuditFn({
      userId: base.userId,
      role: base.role,
      sessionId: base.sessionId,
      ipAddress: base.ipAddress,
      userAgent: base.userAgent,
      tenantIdForDefault: tenantCtx.tenant.id,
    }),
    withTx: buildWithTx(tenantCtx.tenant.id),
  };
}
