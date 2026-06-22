/**
 * Edge middleware — the request-level gate every protected route passes
 * through.
 *
 * Responsibilities (Phase 1):
 *   1. Allow public paths through unauthenticated (login, registration,
 *      public credentials, NextAuth's own routes, Next.js internals).
 *   2. Redirect unauthenticated requests on protected paths to /auth/login
 *      with a `returnTo` query so they land back here after sign-in.
 *   3. Enforce portal scope by URL prefix — a `contributor`-roled user
 *      asking for /enterprise/* gets bounced to their own dashboard
 *      with `?reason=portal_mismatch`.
 *   4. Set request headers for downstream handlers (`x-user-id`,
 *      `x-user-role`, `x-pathname`) so they don't re-read the JWT.
 *
 * NOT in middleware (intentional — Edge runtime constraints):
 *   - Durable Session table validation. The Session helper exists at
 *     `@/lib/session`; route handlers (Node runtime) call it. Middleware
 *     only checks JWT presence.
 *   - Tenant resolution + accessibility. Same reason — handlers call
 *     `@/lib/tenant` helpers with Prisma. Middleware does path-based
 *     portal scope only.
 *   - Audit emit. Audit fires from action handlers, not from routing.
 *   - MFA enforcement. Reserved for a later iteration; for now the JWT
 *     itself carries an `mfaPending` claim and the login flow handles it.
 *   - Server-side RBAC permission checks. These happen at the API
 *     handler level once the resource being acted upon is known.
 *
 * Runtime: Edge (default). The middleware does cookie + JWT inspection
 * only — no Prisma, no Node-specific APIs. Heavy lifting moves to
 * handlers per Next.js 15+/16 best practice.
 *
 * Spec: docs/portal-specs/05-cross-functional.md §3.3
 */

import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* ─────────────────────────── Configuration ─────────────────────────── */

/**
 * Paths that bypass authentication entirely. Anything matching one of
 * these prefixes is allowed through without a session.
 *
 * Order doesn't matter — we use `startsWith` checks.
 */
const PUBLIC_PREFIXES = [
  "/auth", //          login, register, password reset, MFA, SSO callbacks
  "/api/auth", //      NextAuth's own routes
  "/public", //        shareable credential pages
  "/api/public", //    public APIs (e.g. credential verification)
  "/_next", //         Next.js internals
  "/favicon", //       favicon variants
  "/icons", //         static icons
  "/images", //        static images
  "/assets", //        static assets
] as const;

/**
 * The landing route `/` is treated as public — it's the unauthenticated
 * entry point that routes signed-in users to their portal home.
 */
const PUBLIC_EXACT_PATHS = new Set<string>(["/"]);

/**
 * Portal mapping: which paths require which legacy roles.
 *
 * IMPORTANT — order matters: more specific prefixes MUST come first.
 * `/enterprise/reviewer/*` is checked before `/enterprise/*` so a
 * reviewer-only user isn't denied access to the reviewer sub-portal
 * for not having the `enterprise` role.
 *
 * The legacy single-role enum on JWT today:
 *   "contributor" | "enterprise" | "admin" | "super_admin"
 *   | "reviewer" | "mentor"
 *
 * Phase 1B migration target: the scoped role taxonomy seeded in M2
 * (`plat.*`, `ent.*`, `mentor.*`, `contributor`). When the JWT is
 * updated to carry the role array, this table is replaced with a
 * permission-aware check.
 */
const PORTAL_RULES: ReadonlyArray<{
  prefix: string;
  allowedRoles: ReadonlyArray<string>;
}> = [
  // More-specific first
  {
    prefix: "/enterprise/reviewer",
    allowedRoles: ["reviewer", "admin", "super_admin", "enterprise"],
  },
  {
    prefix: "/enterprise",
    allowedRoles: ["enterprise", "admin", "super_admin"],
  },
  {
    prefix: "/contributor",
    allowedRoles: ["contributor"],
  },
  {
    prefix: "/mentor",
    allowedRoles: ["mentor", "admin", "super_admin"],
  },
  {
    prefix: "/api/mock/admin",
    allowedRoles: ["admin", "super_admin"],
  },
  {
    prefix: "/admin",
    allowedRoles: ["admin", "super_admin"],
  },
  {
    prefix: "/analytics",
    // Cross-role surface — every signed-in user can read their own slice
    allowedRoles: [
      "contributor",
      "mentor",
      "enterprise",
      "admin",
      "super_admin",
      "reviewer",
    ],
  },
];

/**
 * Home route per role — where to send a user when they hit a portal
 * they aren't allowed to access, or when they hit `/` while signed in.
 */
const ROLE_HOME: Record<string, string> = {
  contributor: "/contributor/dashboard",
  mentor: "/mentor/dashboard",
  enterprise: "/enterprise/dashboard",
  reviewer: "/enterprise/reviewer",
  admin: "/admin/dashboard",
  super_admin: "/admin/dashboard",
};

/* ───────────────────────────── Helpers ─────────────────────────────── */

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT_PATHS.has(pathname)) return true;
  // Per-role login pages (/admin/login, /enterprise/login, /contributor/login,
  // /mentor/login, /reviewer/login) are public sign-in entry points.
  if (pathname.endsWith("/login")) return true;
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  return false;
}

/**
 * Deep-link to the matching portal's login when the requested path makes the
 * portal obvious, so an unauthenticated user lands on the right branded sign-in.
 */
const PORTAL_LOGIN: ReadonlyArray<readonly [string, string]> = [
  ["/enterprise/reviewer", "/reviewer/login"],
  ["/enterprise", "/enterprise/login"],
  ["/contributor", "/contributor/login"],
  ["/mentor", "/mentor/login"],
  ["/admin", "/admin/login"],
];

function loginPathForRequest(pathname: string): string {
  for (const [prefix, login] of PORTAL_LOGIN) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return login;
  }
  return "/auth/login";
}

function matchPortalRule(
  pathname: string,
): { allowedRoles: ReadonlyArray<string>; prefix: string } | null {
  for (const rule of PORTAL_RULES) {
    if (pathname === rule.prefix || pathname.startsWith(rule.prefix + "/")) {
      return rule;
    }
  }
  return null;
}

function homeForRole(role: string | undefined): string {
  if (!role) return "/auth/login";
  return ROLE_HOME[role] ?? "/auth/login";
}

function loginRedirect(req: NextRequest, reason?: string): NextResponse {
  const url = req.nextUrl.clone();
  const returnTo = `${req.nextUrl.pathname}${req.nextUrl.search}`;
  url.pathname = loginPathForRequest(req.nextUrl.pathname);
  url.search = "";
  url.searchParams.set("returnTo", returnTo);
  if (reason) url.searchParams.set("reason", reason);
  return NextResponse.redirect(url);
}

function portalMismatchRedirect(
  req: NextRequest,
  role: string,
): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = homeForRole(role);
  url.search = "";
  url.searchParams.set("reason", "portal_mismatch");
  return NextResponse.redirect(url);
}

function withRequestHeaders(
  req: NextRequest,
  ctx: { userId: string; role: string },
): NextResponse {
  // Clone the request headers and add our context. Route handlers can
  // read these via `headers().get(...)` without re-parsing the JWT.
  const headers = new Headers(req.headers);
  headers.set("x-user-id", ctx.userId);
  headers.set("x-user-role", ctx.role);
  headers.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

/* ───────────────────────────── Middleware ──────────────────────────── */

// Dev/audit bypass — when DEV_AUTH_BYPASS=1, treat every protected request as
// signed-in as an admin so the portal can be inspected without the upstream
// Glimmora API. Revert before merging to main; flagged loudly so it can't ship.
const DEV_AUTH_BYPASS = process.env.DEV_AUTH_BYPASS === "1";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Legacy identity hub removed — invites live on Tenants / Mentors / Partnerships.
  if (pathname === "/admin/users") {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/tenants";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (DEV_AUTH_BYPASS && !isPublicPath(pathname)) {
    return withRequestHeaders(req, { userId: "dev-admin", role: "super_admin" });
  }

  // 1. Public paths bypass everything.
  if (isPublicPath(pathname)) {
    // If a signed-in user hits the unauthenticated landing, route them
    // to their portal home so they don't see a "log in" page.
    if (pathname === "/" && req.auth?.user) {
      const role =
        (req.auth.user as { role?: string }).role ?? "contributor";
      const url = req.nextUrl.clone();
      url.pathname = homeForRole(role);
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

  // 3. Enforce portal scope.
  const portalRule = matchPortalRule(pathname);
  if (portalRule && !portalRule.allowedRoles.includes(role)) {
    return portalMismatchRedirect(req, role);
  }

  // 4. Set request headers for downstream handlers.
  return withRequestHeaders(req, {
    userId: session.user.id,
    role,
  });
});

/* ───────────────────────────── Matcher ─────────────────────────────── */

/**
 * Skip middleware for static asset paths handled by Next's own loaders.
 * Everything else falls under the public/private logic above.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     *   - _next/static  (build output)
     *   - _next/image   (image optimizer)
     *   - *.{ico,png,svg,jpg,jpeg,gif,webp,avif,css,js,map,woff,woff2}
     */
    "/((?!_next/static|_next/image|.*\\.(?:ico|png|svg|jpg|jpeg|gif|webp|avif|css|js|map|woff|woff2)$).*)",
  ],
};
