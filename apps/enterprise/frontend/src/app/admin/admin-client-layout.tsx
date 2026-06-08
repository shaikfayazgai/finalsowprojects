"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { EnterpriseShell } from "@/components/meridian";
import { adminNav } from "@/lib/config/navigation";
import { filterAdminNav } from "@/lib/admin/filter-admin-nav";
import { useActiveAdmin } from "@/lib/hooks/use-active-admin";
import { useRoleGuard } from "@/lib/hooks/use-role-guard";

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

  // The /admin/login page is a public sign-in screen — render it bare, WITHOUT
  // the dashboard shell or the role guard (which would otherwise show the
  // sidebar around the login and bounce unauthenticated users to home).
  // NOTE: this early return MUST come after all hooks above (Rules of Hooks) —
  // hooks may never be skipped between renders.
  if (pathname?.endsWith("/login")) {
    return <>{children}</>;
  }

  const operatorName = session?.user?.name ?? "Operator";
  const operatorInitials =
    (session?.user as { initials?: string })?.initials ??
    operatorName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <EnterpriseShell
      config={shellConfig}
      operator={{
        name: operatorName,
        initials: operatorInitials,
        email: session?.user?.email ?? undefined,
      }}
    >
      {!ADMIN_DEMO_BYPASS && <AdminGuard />}
      {children}
    </EnterpriseShell>
  );
}
