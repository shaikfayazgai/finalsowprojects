/**
 * Edge middleware (Next.js 16 `proxy` convention) — the request-level gate
 * every protected route passes through.
 *
 * Responsibilities (Phase 1, plans/05-cross-functional §3.3):
 *   1. Allow public paths through unauthenticated (login, register, password
 *      reset, MFA, SSO callbacks, public credential pages, Next internals).
 *   2. Redirect unauthenticated requests on protected paths to /auth/login
 *      with a `returnTo` query so they land back here after sign-in.
 *   3. Enforce portal scope by URL prefix — a `contributor`-roled user asking
 *      for /enterprise/* is bounced to their own dashboard with
 *      `?reason=portal_mismatch`.
 *   4. Set request headers (`x-user-id`, `x-user-role`, `x-pathname`) so
 *      downstream Node-runtime handlers don't re-read the JWT.
 *
 * NOT here (Edge-runtime constraints): durable Session-table validation,
 * tenant resolution, audit emit, MFA enforcement, per-resource RBAC — those
 * run in the API/page handlers once the resource is known.
 *
 * Portal taxonomy / role→portal mapping lives in `@/lib/auth/portal-access`
 * (single source of truth, shared with /auth/redirect and useRoleGuard).
 */

import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  PORTALS,
  portalForPath,
  rolePortal,
  homePathForRole,
} from "@/lib/auth/portal-access";

/* ─────────────────────────── Configuration ─────────────────────────── */

/** Paths that bypass auth entirely (prefix match). */
const PUBLIC_PREFIXES = [
  "/auth", //       login, register, password reset, MFA, SSO callbacks, redirect, select-portal
  "/api/auth", //   NextAuth's own routes
  "/public", //     shareable credential pages
  "/api/public", // public APIs (credential verification)
  "/api/config", // public config (contributor pricing, etc.)
  "/api/mock", //   mock data routes (dev only)
  // Backend-proxy API routes: these forward to the Glimmora backend which
  // enforces its own Bearer-token auth, so the edge guard must not gate them.
  "/api/v1", //          generic backend proxy (billing, review, portfolio, …)
  "/api/contributor", // contributor-service proxy
  "/api/mentor", //      mentor-service proxy
  "/api/superadmin", //  superadmin-service proxy
  "/api/reviewers", //   reviewer invitations proxy
  "/api/decomposition", "/api/sow", "/api/reviewer", "/api/settings", "/api/reviews",
  "/_next", //      Next.js internals
  "/favicon",
  "/icons",
  "/images",
  "/assets",
] as const;

/**
 * Public exact paths: the landing route `/`, and each portal's own login page.
 * The login pages live UNDER protected portal prefixes (/contributor, etc.),
 * so they must be explicitly allowed or the guard would bounce them.
 */
const PUBLIC_EXACT_PATHS = new Set<string>([
  "/",
  // Each portal's own public auth pages (login / signup / forgot / reset / setup).
  ...Object.values(PORTALS).flatMap((p) => [
    `${p.basePath}/login`,
    `${p.basePath}/signup`,
    `${p.basePath}/forgot-password`,
    `${p.basePath}/reset-password`,
    `${p.basePath}/setup-password`,
  ]),
]);

/* ───────────────────────────── Helpers ─────────────────────────────── */

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

/**
 * Send an unauthenticated visitor to the login page of the portal they were
 * trying to reach (so they land on the right branded login), falling back to
 * the home page when the path isn't portal-scoped. `/auth/login` no longer
 * exists — home is the universal entry that offers the portal picker.
 */
function loginRedirect(req: NextRequest, reason?: string): NextResponse {
  const url = req.nextUrl.clone();
  const returnTo = `${req.nextUrl.pathname}${req.nextUrl.search}`;
  const portal = portalForPath(req.nextUrl.pathname);
  url.pathname = portal ? PORTALS[portal].loginPath : "/";
  url.search = "";
  url.searchParams.set("returnTo", returnTo);
  if (reason) url.searchParams.set("reason", reason);
  return NextResponse.redirect(url);
}

function portalMismatchRedirect(req: NextRequest, role: string): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = homePathForRole(role);
  url.search = "";
  url.searchParams.set("reason", "portal_mismatch");
  return NextResponse.redirect(url);
}

function withRequestHeaders(
  req: NextRequest,
  ctx: { userId: string; role: string },
): NextResponse {
  const headers = new Headers(req.headers);
  headers.set("x-user-id", ctx.userId);
  headers.set("x-user-role", ctx.role);
  headers.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

/* ───────────────────────────── Middleware ──────────────────────────── */

// Dev bypass — when DEV_AUTH_BYPASS=1, treat every protected request as a
// signed-in admin so portals can be inspected without the upstream API.
const DEV_AUTH_BYPASS = process.env.DEV_AUTH_BYPASS === "1";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (DEV_AUTH_BYPASS && !isPublicPath(pathname)) {
    return withRequestHeaders(req, { userId: "dev-admin", role: "superadmin" });
  }

  // 1. Public paths bypass everything (but route signed-in users off `/`).
  if (isPublicPath(pathname)) {
    if (pathname === "/" && req.auth?.user) {
      const role = (req.auth.user as { role?: string }).role ?? "contributor";
      const url = req.nextUrl.clone();
      url.pathname = homePathForRole(role);
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 2. Protected paths require a session.
  const session = req.auth;
  if (!session?.user?.id) {
    return loginRedirect(req, "unauthenticated");
  }

  const role = (session.user as { role?: string }).role ?? "contributor";

  // 3. Enforce portal scope: the role's portal must own this path.
  const targetPortal = portalForPath(pathname);
  if (targetPortal && rolePortal(role) !== targetPortal) {
    return portalMismatchRedirect(req, role);
  }

  // 4. Hand context to downstream handlers.
  return withRequestHeaders(req, { userId: session.user.id, role });
});

/* ───────────────────────────── Matcher ─────────────────────────────── */

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:ico|png|svg|jpg|jpeg|gif|webp|avif|css|js|map|woff|woff2)$).*)",
  ],
};
