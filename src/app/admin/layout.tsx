"use client";

import { AppShell } from "@/components/layout";
import { adminNav } from "@/lib/config/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppShell config={adminNav}>{children}</AppShell>;
}
