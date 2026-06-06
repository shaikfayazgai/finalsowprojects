"use client";

import { useAdminSectionGuard } from "@/lib/hooks/use-admin-section-guard";

export default function AdminSystemHealthLayout({ children }: { children: React.ReactNode }) {
  const allowed = useAdminSectionGuard("systemHealth");
  if (!allowed) return null;
  return children;
}
