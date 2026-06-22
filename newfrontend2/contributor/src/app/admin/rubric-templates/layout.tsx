"use client";

import { useAdminSectionGuard } from "@/lib/hooks/use-admin-section-guard";

export default function AdminRubricTemplatesLayout({ children }: { children: React.ReactNode }) {
  const allowed = useAdminSectionGuard("rubricTemplates");
  if (!allowed) return null;
  return children;
}
