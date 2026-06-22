"use client";

import { useAdminSectionGuard } from "@/lib/hooks/use-admin-section-guard";

export default function AdminKycLayout({ children }: { children: React.ReactNode }) {
  const allowed = useAdminSectionGuard("kyc");
  if (!allowed) return null;
  return children;
}
