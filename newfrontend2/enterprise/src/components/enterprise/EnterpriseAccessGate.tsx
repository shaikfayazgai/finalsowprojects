"use client";

/**
 * Blocks enterprise page paint until tenant roles resolve, then enforces route RBAC.
 */

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { canAccessEnterprisePath } from "@/lib/enterprise/rbac";
import { useEnterpriseAccess } from "@/lib/hooks/use-enterprise-access";

export function EnterpriseAccessGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { sessionStatus, meLoading, roles, homePath } = useEnterpriseAccess();
  const redirected = useRef(false);

  useEffect(() => {
    redirected.current = false;
  }, [pathname]);

  useEffect(() => {
    if (redirected.current) return;
    if (sessionStatus === "loading" || meLoading) return;
    if (!pathname.startsWith("/enterprise")) return;
    if (pathname.startsWith("/enterprise/onboarding")) return;
    if (roles.length === 0) return;

    if (!canAccessEnterprisePath(pathname, roles)) {
      redirected.current = true;
      router.replace(homePath);
    }
  }, [sessionStatus, meLoading, pathname, roles, homePath, router]);

  // In demo mode the portal is mock-first; don't block paint on a session /
  // /api/me that can't resolve without a backend (roles fall back to admin).
  const demo = process.env.NEXT_PUBLIC_ENTERPRISE_DEMO === "1";
  const resolving = !demo && (sessionStatus === "loading" || meLoading);
  const pendingRoles = !demo && sessionStatus === "authenticated" && roles.length === 0;

  if (resolving || pendingRoles) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-brand" strokeWidth={2} aria-hidden />
        <p className="font-body text-[13px] text-text-tertiary">Loading your workspace…</p>
      </div>
    );
  }

  if (roles.length > 0 && !canAccessEnterprisePath(pathname, roles)) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-brand" strokeWidth={2} aria-hidden />
        <p className="font-body text-[13px] text-text-tertiary">Redirecting to your workspace…</p>
      </div>
    );
  }

  return <>{children}</>;
}
