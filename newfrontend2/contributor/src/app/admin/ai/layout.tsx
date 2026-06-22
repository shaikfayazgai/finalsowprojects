"use client";

import { useAdminSectionGuard } from "@/lib/hooks/use-admin-section-guard";

export default function AdminAILayout({ children }: { children: React.ReactNode }) {
  const allowed = useAdminSectionGuard("ai");
  if (!allowed) return null;
  return children;
}
