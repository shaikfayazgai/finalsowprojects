"use client";

import { useAdminSectionGuard } from "@/lib/hooks/use-admin-section-guard";

export default function AdminAuditLayout({ children }: { children: React.ReactNode }) {
  const allowed = useAdminSectionGuard("audit");
  if (!allowed) return null;
  return children;
}
