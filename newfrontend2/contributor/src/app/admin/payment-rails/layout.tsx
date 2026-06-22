"use client";

import { useAdminSectionGuard } from "@/lib/hooks/use-admin-section-guard";

export default function AdminPaymentRailsLayout({ children }: { children: React.ReactNode }) {
  const allowed = useAdminSectionGuard("paymentRails");
  if (!allowed) return null;
  return children;
}
