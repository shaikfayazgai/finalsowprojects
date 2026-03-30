"use client";

import { AppShell } from "@/components/layout";
import { ErrorBoundary } from "@/components/error-boundary";
import { contributorNav } from "@/lib/config/navigation";

export default function ContributorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell config={contributorNav}><ErrorBoundary>{children}</ErrorBoundary></AppShell>;
}
