"use client";

import { AppShell } from "@/components/layout";
import { enterpriseNav } from "@/lib/config/navigation";

export default function EnterpriseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell config={enterpriseNav}>{children}</AppShell>;
}
