"use client";

import { useAdminSectionGuard } from "@/lib/hooks/use-admin-section-guard";

export default function AdminUniversitiesLayout({ children }: { children: React.ReactNode }) {
  const allowed = useAdminSectionGuard("universities");
  if (!allowed) return null;
  return children;
}
