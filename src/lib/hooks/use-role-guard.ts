"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type Role = "admin" | "reviewer" | "contributor" | "enterprise" | "mentor";

const DASHBOARD_BY_ROLE: Record<string, string> = {
  admin:       "/admin/dashboard",
  reviewer:    "/enterprise/reviewer",
  contributor: "/contributor/dashboard",
  enterprise:  "/enterprise/dashboard",
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
      if (pathname !== "/auth/login") {
        redirectedRef.current = true;
        router.replace("/auth/login");
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
  }, [status, session, allowedKey, pathname, router, allowed]);

  return status;
}
