"use client";

import { useAdminSectionGuard } from "@/lib/hooks/use-admin-section-guard";

export default function AdminMentorsLayout({ children }: { children: React.ReactNode }) {
  const allowed = useAdminSectionGuard("mentors");
  if (!allowed) return null;
  return children;
}
