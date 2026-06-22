"use client";

import { usePathname } from "next/navigation";

/**
 * Auth layout. Login, register, and forgot-password own their shells.
 * Other /auth/* pages use AuthShell or a local layout.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const selfContained =
    pathname === "/auth/login" ||
    pathname === "/auth/register" ||
    pathname === "/auth/forgot-password";
  if (selfContained) return <>{children}</>;
  return <div className="min-h-dvh bg-surface">{children}</div>;
}
