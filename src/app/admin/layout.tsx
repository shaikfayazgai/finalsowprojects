"use client";

import { AppShell } from "@/components/layout";
import { adminNav } from "@/lib/config/navigation";
import { useRoleGuard } from "@/lib/hooks/use-role-guard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  useRoleGuard(["admin"]);
  return <AppShell config={adminNav}>{children}</AppShell>;
}
