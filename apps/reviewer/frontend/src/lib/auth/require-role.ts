/**
 * Server-side authorization primitive.
 *
 * Use inside API route handlers (and React Server Components) to assert
 * that the current request carries a NextAuth session whose role belongs
 * to the allowed set. On failure, returns a `NextResponse` with the
 * correct HTTP status the route handler can return directly.
 *
 *   const guard = await requireRole(["enterprise", "admin"]);
 *   if (guard instanceof Response) return guard;       // 401 / 403
 *   const { session } = guard;                          // typed session
 *
 * Why a class-of-helpers and not middleware: middleware runs in the
 * edge runtime where the JWE token can fail to decode (see proxy.ts
 * comment block on `sessionLikelyValid`). Route handlers run in the
 * Node runtime and can use the full `auth()` helper, which decodes
 * tokens reliably and gives us the session payload.
 */

import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

export type Role =
  | "contributor"
  | "enterprise"
  | "mentor"
  | "reviewer"
  | "admin"
  | "super_admin";

export interface AuthorizedSession {
  /** Session shape as configured in src/auth.ts. */
  session: Session;
  /** Convenience access. */
  userId: string;
  email: string;
  role: Role;
}

/**
 * Assert a session exists. Returns the session or a 401 response.
 * Use when a route needs any authenticated user, regardless of role.
 */
export async function requireSession(): Promise<AuthorizedSession | NextResponse> {
  const session = (await auth()) as Session | null;
  if (!session?.user) {
    return NextResponse.json(
      { error: "unauthenticated", message: "Authentication required" },
      { status: 401 },
    );
  }
  const role = (session.user as { role?: string }).role;
  if (!role) {
    return NextResponse.json(
      { error: "unauthenticated", message: "Session is missing role" },
      { status: 401 },
    );
  }
  return {
    session,
    userId: (session.user as { id?: string }).id ?? "",
    email: session.user.email ?? "",
    role: role as Role,
  };
}

/**
 * Assert the current session's role belongs to `allowed`. Returns the
 * session or a 401/403 response.
 *
 * Authorization-failure responses are deliberately terse — they don't
 * disclose what role was needed (defense in depth).
 */
export async function requireRole(
  allowed: Role[],
): Promise<AuthorizedSession | NextResponse> {
  const got = await requireSession();
  if (got instanceof NextResponse) return got;
  if (!allowed.includes(got.role)) {
    return NextResponse.json(
      { error: "forbidden", message: "Insufficient permissions" },
      { status: 403 },
    );
  }
  return got;
}
