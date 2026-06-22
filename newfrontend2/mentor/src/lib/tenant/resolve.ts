/**
 * Tenant resolution.
 *
 * Three discrete entry points — the middleware (and any other caller)
 * picks the right one based on what it knows. None of them enforce
 * accessibility; combine with tenantAccessibility() to decide whether
 * the caller can act.
 *
 * Spec reference: docs/portal-specs/05-cross-functional.md §3.3 (middleware
 * contract) + §3.5 (tenant isolation via RLS).
 */

import { prisma } from "@/lib/db";
import type { TenantAccessibility, TenantContext } from "./types";

/**
 * Resolve the tenant from a user's identity. For enterprise users
 * (sponsor, pmo, finance, compliance, reviewer, procurement, it) this
 * is the primary path — every request from such a user is implicitly
 * tenant-scoped via User.tenantId.
 *
 * Returns null for:
 *   - users with no tenantId set (contributors, mentors, plat.* admins)
 *   - userIds that don't exist
 *   - users whose tenantId points to a non-existent or soft-deleted tenant
 */
export async function resolveTenantForUser(
  userId: string,
): Promise<TenantContext | null> {
  // The mentor portal runs against the FastAPI backend and has no Prisma
  // database configured. Mentors are cross-tenant (tenantId is always null for
  // them), so the correct answer here is null anyway — but the Prisma call would
  // THROW without a DATABASE_URL and crash every authenticated mentor route
  // (profile, /me, settings, …). Fail-safe to null when Prisma is unavailable.
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    });
    if (!user?.tenantId) return null;

    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
    });
    if (!tenant || tenant.deletedAt) return null;

    return { tenant, source: "user" };
  } catch {
    // No Prisma DB (e.g. mentor standalone deployment) → treat as tenant-less.
    return null;
  }
}

/**
 * Resolve tenant by URL slug or `x-tenant-slug` header. Used when a
 * cross-tenant operator (platform admin, TSM, mentor, etc.) needs to
 * act within a specific tenant — e.g., a TSM provisioning Acme Corp,
 * or a mentor reviewing a task that lives in Acme's project.
 *
 * Caller MUST verify the resolved tenant is in the operator's scope of
 * permitted tenants before honoring it.
 */
export async function resolveTenantBySlug(
  slug: string,
): Promise<TenantContext | null> {
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant || tenant.deletedAt) return null;
  return { tenant, source: "slug" };
}

/**
 * Direct lookup by tenant id. Used internally (job runners, audit
 * filtering, cross-portal handoffs where one service hands the tenant
 * id to another).
 */
export async function resolveTenantById(
  id: string,
): Promise<TenantContext | null> {
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant || tenant.deletedAt) return null;
  return { tenant, source: "id" };
}

/**
 * Classify a tenant's accessibility based on its `status` field.
 *
 * Caller policy:
 *   - 'open'       → proceed
 *   - 'admin_only' → reject unless caller is plat.admin / plat.tsm
 *   - 'blocked'    → reject (tenant paused)
 *   - 'closed'     → reject for business actions; allow read for
 *                    compliance + legal only
 *
 * Unknown statuses fail closed (return 'blocked') — defensive default.
 */
export function tenantAccessibility(tenant: {
  status: string;
}): TenantAccessibility {
  switch (tenant.status) {
    case "active":
      return "open";
    case "provisioning":
      return "admin_only";
    case "paused":
      return "blocked";
    case "closed":
      return "closed";
    default:
      return "blocked";
  }
}
