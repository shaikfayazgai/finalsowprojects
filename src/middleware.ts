import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that require authentication
const protectedRoutes = ["/enterprise", "/contributor", "/mentor"];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ["/auth/login", "/auth/register"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Use getToken (Edge-compatible) instead of importing auth (which pulls in bcryptjs)
  let isLoggedIn = false;
  let userRole = "enterprise";
  try {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    isLoggedIn = !!token?.email;
    if (token?.role) userRole = token.role as string;
  } catch {
    isLoggedIn = false;
  }

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/auth/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth routes based on their role
  if (isAuthRoute && isLoggedIn) {
    const dest =
      userRole === "contributor" ? "/contributor/dashboard" :
      userRole === "mentor" ? "/mentor/dashboard" :
      "/enterprise/dashboard";
    return NextResponse.redirect(new URL(dest, req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
