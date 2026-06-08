/**
 * Tenant resolution layer — public surface.
 *
 * Typical middleware usage:
 *
 *   const sessionUser = await validateSession(req);          // (next deliverable)
 *   if (!sessionUser) return unauthenticated();
 *
 *   let tenantCtx = await resolveTenantForUser(sessionUser.id);
 *   if (!tenantCtx) {
 *     // cross-tenant user — try URL slug
 *     const slug = req.nextUrl.pathname.match(/^\/enterprise\/([^/]+)/)?.[1];
 *     if (slug) tenantCtx = await resolveTenantBySlug(slug);
 *   }
 *
 *   if (tenantCtx) {
 *     const access = tenantAccessibility(tenantCtx.tenant);
 *     if (access === 'blocked') return tenantPaused();
 *     if (access === 'closed')  return tenantClosed();
 *     // 'admin_only' / 'open' handled per route
 *   }
 *
 *   // Inside the request handler:
 *   await prisma.$transaction(async (tx) => {
 *     if (tenantCtx) await setTransactionTenant(tx, tenantCtx.tenant.id);
 *     // ... tenant-scoped queries
 *   });
 */

export {
  resolveTenantForUser,
  resolveTenantBySlug,
  resolveTenantById,
  tenantAccessibility,
} from "./resolve";

export {
  setTransactionTenant,
  clearTransactionTenant,
} from "./transaction";

export type {
  TenantContext,
  TenantResolutionSource,
  TenantAccessibility,
} from "./types";
