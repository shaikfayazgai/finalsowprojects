"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Role = "admin" | "reviewer" | "contributor" | "enterprise" | "mentor";

const DASHBOARD_BY_ROLE: Record<string, string> = {
  admin:       "/admin/dashboard",
  reviewer:    "/enterprise/reviewer",
  contributor: "/contributor/dashboard",
  enterprise:  "/enterprise/dashboard",
};

/**
 * Strict role-based route guard.
 * - Unauthenticated → /auth/login
 * - Authenticated with wrong role → redirected to the dashboard matching their role
 *   (or /auth/login if their role has no mapping).
 */
export function useRoleGuard(allowed: Role[]) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace("/auth/login");
      return;
    }

    const role = (session?.user as { role?: Role } | undefined)?.role;
    if (!role || !allowed.includes(role)) {
      const target = role && DASHBOARD_BY_ROLE[role] ? DASHBOARD_BY_ROLE[role] : "/auth/login";
      router.replace(target);
    }
  }, [status, session, allowed, router]);

  return status;
}
