import { auth } from "@/auth";

/* Role → allowed route prefixes */
const roleRoutes: Record<string, string[]> = {
  enterprise: ["/enterprise"],
  contributor: ["/contributor"],
  mentor: ["/mentor"],
  analytics: ["/analytics", "/enterprise/analytics"],
};

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public routes — no auth required
  const publicPaths = ["/auth", "/api/auth", "/onboarding"];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));
  if (isPublic) return;

  // Root path is handled by page.tsx (server redirect)
  if (pathname === "/") return;

  // If not authenticated, redirect to login
  if (!req.auth) {
    const loginUrl = new URL("/auth/login", req.url);
    // Validate callbackUrl is a relative path (prevent open redirect)
    if (pathname.startsWith("/") && !pathname.startsWith("//")) {
      loginUrl.searchParams.set("callbackUrl", pathname);
    }
    return Response.redirect(loginUrl);
  }

  // Role-based route protection
  const role = (req.auth.user as any)?.role as string | undefined;
  if (role) {
    const allowedPrefixes = roleRoutes[role];
    if (allowedPrefixes) {
      const isProtectedModule = Object.values(roleRoutes).flat().some((prefix) => pathname.startsWith(prefix));
      if (isProtectedModule) {
        const hasAccess = allowedPrefixes.some((prefix) => pathname.startsWith(prefix));
        if (!hasAccess) {
          // Redirect to their own dashboard
          const dashboards: Record<string, string> = {
            enterprise: "/enterprise/dashboard",
            contributor: "/contributor/dashboard",
            mentor: "/mentor/dashboard",
            analytics: "/analytics/overview",
          };
          return Response.redirect(new URL(dashboards[role] || "/", req.url));
        }
      }
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
