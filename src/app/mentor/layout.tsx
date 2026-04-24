"use client";

import { AppShell } from "@/components/layout";
import { mentorNav } from "@/lib/config/navigation";
import { useRoleGuard } from "@/lib/hooks/use-role-guard";

export default function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useRoleGuard(["mentor"]);
  return <AppShell config={mentorNav}>{children}</AppShell>;
}
