"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { homePathForRole, rolePortal, portalForPath, PORTALS, type PortalKey } from "@/lib/auth/portal-access";

/**
 * Client-side portal guard (UX layer — server middleware is authoritative).
 *
 * Pass the portal(s) this subtree belongs to. If the signed-in user's role maps
 * to a different portal, we replace to their own dashboard. Backwards-compatible
 * with the old call style that passed raw role strings: any value that isn't a
 * PortalKey is resolved through rolePortal().
 *
 * Loop guards retained from the prior implementation:
 *  - fires router.replace at most once per mount
 *  - never redirects to the path you're already on
 *  - ignores the loading state and the brief role-less hydration window
 */
const PORTAL_KEYS: PortalKey[] = ["contributor", "enterprise", "mentor", "admin"];

function toPortalKey(value: string): PortalKey | null {
  if ((PORTAL_KEYS as string[]).includes(value)) return value as PortalKey;
  return rolePortal(value);
}

export function useRoleGuard(allowed: string[]) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const redirectedRef = useRef(false);

  const allowedPortals = [...new Set(allowed.map(toPortalKey).filter(Boolean))] as PortalKey[];
  const allowedKey = allowedPortals.join(",");

  useEffect(() => {
    if (redirectedRef.current) return;
    if (status === "loading") return;
    // Empty allow-list = "don't guard this route" (e.g. a portal's own public
    // login page rendered under the portal layout). Skip entirely.
    if (allowedPortals.length === 0) return;

    if (status === "unauthenticated") {
      // Send to the login of the portal this subtree belongs to (or home).
      const portal = portalForPath(pathname) ?? allowedPortals[0];
      const target = portal ? PORTALS[portal].loginPath : "/";
      if (pathname !== target) {
        redirectedRef.current = true;
        router.replace(target);
      }
      return;
    }

    const role = (session?.user as { role?: string } | undefined)?.role;
    // Authenticated but role not hydrated yet — wait a tick (prevents prod bounce).
    if (!role) return;

    const myPortal = rolePortal(role);
    if (myPortal && !allowedPortals.includes(myPortal)) {
      const target = homePathForRole(role);
      if (target !== pathname) {
        redirectedRef.current = true;
        router.replace(target);
      }
    }
  // allowedKey serializes `allowed`; including the array identity would re-fire each render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, allowedKey, pathname, router]);

  return status;
}
