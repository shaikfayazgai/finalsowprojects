"use client";

import { AppShell } from "@/components/layout";
import { adminNav } from "@/lib/config/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Role guard moved to individual pages for better UX — allows showing error
  // messages instead of redirecting on every refresh during session hydration
  return <AppShell config={adminNav}>{children}</AppShell>;
}
