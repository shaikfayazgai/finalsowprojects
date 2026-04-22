import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that require authentication
const protectedRoutes = ["/enterprise", "/contributor", "/mentor", "/admin"];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ["/auth/login", "/auth/register"];

// Role-to-dashboard map (kept in sync with /auth/redirect and useRoleGuard).
const DASHBOARD_BY_ROLE: Record<string, string> = {
  contributor: "/contributor/dashboard",
  mentor:      "/mentor/dashboard",
  admin:       "/admin/dashboard",
  reviewer:    "/enterprise/reviewer",
  enterprise:  "/enterprise/dashboard",
};

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // secureCookie must be true on HTTPS (Vercel) so getToken reads
  // "__Secure-authjs.session-token" instead of "authjs.session-token".
  const secureCookie = req.nextUrl.protocol === "https:";
  const cookieName = secureCookie
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  // NextAuth v5 JWE is encrypted with a salt derived from the cookie name.
  // Passing salt + cookieName explicitly avoids a null token in prod when the
  // defaults drift between beta releases (the cause of the post-login redirect
  // loop — getToken returned null, proxy redirected to /auth/login?callbackUrl=…,
  // the login page saw the session and bounced back to the dashboard).
  let isLoggedIn = false;
  let userRole = "";
  let tokenDecoded = false;
  try {
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
      secureCookie,
      cookieName,
      salt: cookieName,
    });
    if (token) {
      tokenDecoded = true;
      isLoggedIn = !!(token.email || token.sub);
      userRole = (token.role as string) || "";
    }
  } catch {
    tokenDecoded = false;
  }

  // If the token failed to decode but the raw session cookie is present, the
  // user very likely has a valid session that we can't inspect from the edge
  // runtime. Letting them through avoids the login-bounce loop; the server
  // component / useRoleGuard will make the authoritative call.
  const hasSessionCookie = !!req.cookies.get(cookieName)?.value;
  const sessionLikelyValid = isLoggedIn || (!tokenDecoded && hasSessionCookie);

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !sessionLikelyValid) {
    const loginUrl = new URL("/auth/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth routes (role-based). Only
  // act on decoded tokens — when the token didn't decode we can't reliably
  // pick a destination, so let the page render and /auth/redirect handle it.
  if (isAuthRoute && isLoggedIn) {
    const dest = DASHBOARD_BY_ROLE[userRole] || "/auth/redirect";
    return NextResponse.redirect(new URL(dest, req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
