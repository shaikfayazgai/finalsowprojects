"use client";

import { useAdminSectionGuard } from "@/lib/hooks/use-admin-section-guard";

export default function AdminWomenWorkforceLayout({ children }: { children: React.ReactNode }) {
  const allowed = useAdminSectionGuard("womenWorkforce");
  if (!allowed) return null;
  return children;
}
