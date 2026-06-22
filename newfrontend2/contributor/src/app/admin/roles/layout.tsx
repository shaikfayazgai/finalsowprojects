"use client";

import { useAdminSectionGuard } from "@/lib/hooks/use-admin-section-guard";

export default function AdminRolesLayout({ children }: { children: React.ReactNode }) {
  const allowed = useAdminSectionGuard("roles");
  if (!allowed) return null;
  return children;
}
