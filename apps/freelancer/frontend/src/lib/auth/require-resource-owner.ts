/**
 * Server-side per-resource ownership guard.
 *
 * Composes with `requireRole` for routes that handle per-user data
 * (`/api/contributor/profile`, `/api/contributor/credentials/[id]`,
 * `/api/contributor/submissions/[id]`, etc.). Role check alone is not
 * enough: a contributor can have the right role and still try to read
 * another contributor's resource by changing the URL parameter.
 *
 *   const guard = await requireRole(["contributor"]);
 *   if (guard instanceof Response) return guard;
 *   const own = requireResourceOwner(guard, resource.userId);
 *   if (own instanceof Response) return own;
 *
 * Admin / super_admin override is built in — admins can access any
 * resource (auditable separately via the AuditLog table once that lands).
 */

import { NextResponse } from "next/server";
import type { AuthorizedSession } from "./require-role";

/**
 * Assert the session user owns the resource. Returns the session on
 * success, a 403 response on mismatch. Admin / super_admin roles bypass
 * the ownership check (their access should be audited separately).
 */
export function requireResourceOwner(
  session: AuthorizedSession,
  resourceOwnerId: string | null | undefined,
): AuthorizedSession | NextResponse {
  // Admin override — they can read any resource. AuditLog should
  // record these accesses once the observability slice lands.
  if (session.role === "admin" || session.role === "super_admin") {
    return session;
  }
  if (!resourceOwnerId) {
    return NextResponse.json(
      { error: "forbidden", message: "Resource owner unknown" },
      { status: 403 },
    );
  }
  if (session.userId !== resourceOwnerId) {
    return NextResponse.json(
      { error: "forbidden", message: "Insufficient permissions" },
      { status: 403 },
    );
  }
  return session;
}
