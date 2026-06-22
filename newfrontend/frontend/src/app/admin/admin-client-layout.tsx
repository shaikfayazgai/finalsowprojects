"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { AdminShell } from "./_shell/AdminShell";
import { adminNav } from "@/lib/config/navigation";
import { filterAdminNav } from "@/lib/admin/filter-admin-nav";
import { useActiveAdmin } from "@/lib/hooks/use-active-admin";
import { useRoleGuard } from "@/lib/hooks/use-role-guard";

// Routes under /admin that must render WITHOUT the admin shell/guard
// (they're public, pre-auth pages — e.g. the dedicated admin login).
const BARE_ADMIN_ROUTES = new Set<string>(["/admin/login", "/admin/reset-password"]);

// Bypass token while pre-prod: NEXT_PUBLIC_ADMIN_DEMO=1 lets stakeholders
// navigate the new IA without a real Glimmora-SSO session.
const ADMIN_DEMO_BYPASS = process.env.NEXT_PUBLIC_ADMIN_DEMO === "1";

function AdminGuard() {
  useRoleGuard(["admin", "super_admin"]);
  return null;
}

export function AdminClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { role: platRole } = useActiveAdmin();
  const shellConfig = useMemo(
    () => filterAdminNav(adminNav, platRole),
    [platRole],
  );

  // Public pre-auth admin pages (login) render bare — no shell, no role guard.
  if (BARE_ADMIN_ROUTES.has(pathname)) {
    return <>{children}</>;
  }

  const operatorName = session?.user?.name ?? "Operator";
  const operatorInitials =
    (session?.user as { initials?: string })?.initials ??
    operatorName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <AdminShell
      config={shellConfig}
      operator={{
        name: operatorName,
        initials: operatorInitials,
        email: session?.user?.email ?? undefined,
      }}
    >
      {!ADMIN_DEMO_BYPASS && <AdminGuard />}
      {children}
    </AdminShell>
  );
}
