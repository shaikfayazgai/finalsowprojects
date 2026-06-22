"use client";

import { useAdminSectionGuard } from "@/lib/hooks/use-admin-section-guard";

// Route guard for the Tenants section. Without this, personas excluded from
// the Tenants nav (e.g. plat.ai, plat.partnerships) could still reach the
// tenant + provisioning pages by typing the URL — a privilege escalation.
export default function AdminTenantsLayout({ children }: { children: React.ReactNode }) {
  const allowed = useAdminSectionGuard("tenants");
  if (!allowed) return null;
  return children;
}
