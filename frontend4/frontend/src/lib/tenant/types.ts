/**
 * Types for the tenant resolution layer.
 *
 * The resolver functions return a TenantContext when a tenant can be
 * resolved, or null when no tenant applies (cross-tenant user request
 * with no explicit tenant slug).
 */

import type { Tenant } from "@/generated/prisma/client";

/**
 * Where a resolved tenant came from. Affects audit annotations + which
 * permissions apply.
 *
 *   - 'user'  — from the authenticated User.tenantId (enterprise users)
 *   - 'slug'  — from URL path segment or `x-tenant-slug` header
 *               (cross-tenant operators acting within a specific tenant)
 *   - 'id'    — direct lookup, used internally (job runners, AuditEvent
 *               filtering, etc.)
 */
export type TenantResolutionSource = "user" | "slug" | "id";

export interface TenantContext {
  tenant: Tenant;
  source: TenantResolutionSource;
}

/**
 * What a tenant's status means for incoming requests:
 *
 *   - 'open'        — all users can act normally
 *   - 'admin_only'  — provisioning incomplete; only platform admins
 *                     should act (TSM, plat.admin)
 *   - 'blocked'     — tenant paused; all logins + actions rejected
 *   - 'closed'      — terminal; read-only audit access for compliance
 *                     + legal; no business actions
 */
export type TenantAccessibility =
  | "open"
  | "admin_only"
  | "blocked"
  | "closed";
