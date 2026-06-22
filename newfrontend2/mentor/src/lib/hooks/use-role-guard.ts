"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { loginUrlForPath } from "@/lib/auth/session-cleanup";

type Role = "admin" | "super_admin" | "reviewer" | "contributor" | "enterprise" | "mentor";

const DASHBOARD_BY_ROLE: Record<string, string> = {
  admin:       "/admin/dashboard",
  super_admin: "/admin/dashboard",
  reviewer:    "/enterprise/reviewer",
  contributor: "/contributor/dashboard",
  enterprise:  "/enterprise/dashboard",
  mentor:      "/mentor/dashboard",
};

/**
 * Strict role-based route guard.
 *
 * Guards against production redirect loops:
 *  - Fires router.replace at most once per mount.
 *  - Never redirects to the same pathname the user is already on.
 *  - Ignores the "loading" state and the brief window where an authenticated
 *    session has no role yet (token has to round-trip through /api/auth/session
 *    after sign-in). Bouncing on an empty role during that window is what
 *    caused the prod auto-refresh.
 */
export function useRoleGuard(allowed: Role[]) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const redirectedRef = useRef(false);

  // Serialize the allowed array so array identity changes don't re-run the effect.
  const allowedKey = allowed.join(",");

  useEffect(() => {
    if (redirectedRef.current) return;
    if (status === "loading") return;

    if (status === "unauthenticated") {
      // Session ended/expired — send back to the portal's login page (mentor →
      // /mentor/login). The login page wipes client state on mount.
      const loginUrl = loginUrlForPath(pathname);
      if (pathname !== loginUrl) {
        redirectedRef.current = true;
        router.replace(loginUrl);
      }
      return;
    }

    const role = (session?.user as { role?: Role } | undefined)?.role;

    // Authenticated but role not yet populated in the session — wait one more
    // tick instead of redirecting. Without this the guard can kick the user
    // out during the brief JWT-hydration window that's visible in production.
    if (!role) return;

    if (!allowed.includes(role)) {
      const target = DASHBOARD_BY_ROLE[role] ?? "/auth/login";
      if (target !== pathname) {
        redirectedRef.current = true;
        router.replace(target);
      }
    }
  // `allowed` is intentionally omitted — `allowedKey` already serializes its
  // content, and including the array identity would re-fire on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, allowedKey, pathname, router]);

  return status;
}
