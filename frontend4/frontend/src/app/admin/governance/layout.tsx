"use client";

import { useAdminSectionGuard } from "@/lib/hooks/use-admin-section-guard";

export default function AdminGovernanceLayout({ children }: { children: React.ReactNode }) {
  const allowed = useAdminSectionGuard("governance");
  if (!allowed) return null;
  return children;
}
