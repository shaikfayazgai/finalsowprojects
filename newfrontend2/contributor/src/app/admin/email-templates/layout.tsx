"use client";

import { useAdminSectionGuard } from "@/lib/hooks/use-admin-section-guard";

export default function AdminEmailTemplatesLayout({ children }: { children: React.ReactNode }) {
  const allowed = useAdminSectionGuard("emailTemplates");
  if (!allowed) return null;
  return children;
}
