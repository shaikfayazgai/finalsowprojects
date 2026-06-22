"use client";

import { useAdminSectionGuard } from "@/lib/hooks/use-admin-section-guard";

export default function AdminSkillTaxonomyLayout({ children }: { children: React.ReactNode }) {
  const allowed = useAdminSectionGuard("skillTaxonomy");
  if (!allowed) return null;
  return children;
}
