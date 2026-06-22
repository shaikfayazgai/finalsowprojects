"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { AdminShell as AuroraShell } from "@/app/admin/_shell/AdminShell";
import {
  SubscriptionRouteGate,
  TenantStatusBanner,
} from "@/components/enterprise/subscription/SubscriptionGate";
import { enterpriseNav, reviewerNav } from "@/lib/config/navigation";
import { filterEnterpriseNav } from "@/lib/subscription/nav-gates";
import { EnterpriseAccessGate } from "@/components/enterprise/EnterpriseAccessGate";
import { useEnterpriseAccess } from "@/lib/hooks/use-enterprise-access";
import { SuspendedWorkspace } from "@/components/enterprise/SuspendedWorkspace";
import { useTenantSubscription } from "@/lib/hooks/use-tenant-subscription";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useRoleGuard } from "@/lib/hooks/use-role-guard";
import { clearClientSession } from "@/lib/auth/clear-client-session";

// Demo flag skips legacy JWT portal guard only — tenant ent.* RBAC always applies.
const ENTERPRISE_DEMO_BYPASS = process.env.NEXT_PUBLIC_ENTERPRISE_DEMO === "1";

function EnterpriseGuard({ isReviewer }: { isReviewer: boolean }) {
  // Enterprise admins navigate into the reviewer sub-portal from the Reviews
  // sidebar entry — they need read access, so allow both roles there.
  useRoleGuard(isReviewer ? ["reviewer", "enterprise"] : ["enterprise"]);
  return null;
}

export default function EnterpriseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const pendingOnboarding = useAuthStore((s) => s.pendingOnboarding);
  const setPendingOnboarding = useAuthStore((s) => s.setPendingOnboarding);
  const isOnboarding = pathname.startsWith("/enterprise/onboarding");
  const isResetPassword = pathname.startsWith("/enterprise/reset-password");
  // Auth surfaces that live under /enterprise/* but must render WITHOUT the
  // enterprise shell, role guards, or subscription calls — they are their own
  // full-page experiences (login is even reachable while signed out).
  const isAuthPage =
    pathname.startsWith("/enterprise/login") ||
    pathname.startsWith("/enterprise/users/login") ||
    pathname.startsWith("/enterprise/forgot-password") ||
    isResetPassword;

  // Forced first-login password reset. The backend flags freshly-provisioned
  // accounts with `must_change_password`, surfaced as
  // `session.user.requiresPasswordChange`. Until they reset, bounce every
  // enterprise route to the reset screen.
  const requiresPasswordChange = Boolean(
    (session?.user as { requiresPasswordChange?: boolean } | undefined)
      ?.requiresPasswordChange,
  );
  useEffect(() => {
    if (status === "authenticated" && requiresPasswordChange && !isResetPassword) {
      router.replace("/enterprise/reset-password");
    }
  }, [status, requiresPasswordChange, isResetPassword, router]);

  // Session expired / signed out while on a protected enterprise route →
  // wipe any cached client state and bounce to the enterprise login. This
  // guarantees a guest browser can never sit on the dashboard showing the
  // previous user's data. Auth pages (login/forgot/reset) are exempt.
  useEffect(() => {
    if (status === "unauthenticated" && !isAuthPage) {
      clearClientSession();
      router.replace("/enterprise/login?reason=session_expired");
    }
  }, [status, isAuthPage, router]);
  const inReviewerArea = pathname.startsWith("/enterprise/reviewer");
  const sessionRole = (session?.user as { role?: string } | undefined)?.role;
  // Only swap to the reviewer sidebar/IA for actual reviewer-role users (who sign
  // in at /reviewer/login); an enterprise user browsing /enterprise/reviewer/*
  // keeps the enterprise sidebar so it doesn't feel like a different portal.
  const isReviewer = inReviewerArea && sessionRole === "reviewer";
  // Skip subscription for reviewer users; also skip while role is unresolved inside
  // the reviewer IA so a hard refresh doesn't fire /api/enterprise/subscription
  // before the JWT role is hydrated (reviewer role → 403).
  const skipSubscription =
    isAuthPage ||
    isReviewer ||
    (inReviewerArea &&
      sessionRole !== "enterprise" &&
      sessionRole !== "admin" &&
      sessionRole !== "super_admin");

  const { data: subscription } = useTenantSubscription({ enabled: !skipSubscription });
  const { roles: tenantRoles, homePath, tenantStatus } = useEnterpriseAccess();
  const navConfig = useMemo(() => {
    if (isReviewer) return reviewerNav;
    const filtered = filterEnterpriseNav(enterpriseNav, subscription ?? undefined, tenantRoles);
    return { ...filtered, homePath };
  }, [isReviewer, subscription, tenantRoles, homePath]);

  const provider = (session?.user as { provider?: string })?.provider;
  const isSSO = provider === "google" || provider === "microsoft-entra-id";

  // Clear stale pendingOnboarding flag when a non-SSO (manual) user is detected.
  useEffect(() => {
    if (status === "authenticated" && !isSSO && pendingOnboarding) {
      setPendingOnboarding(false);
    }
  }, [status, isSSO, pendingOnboarding, setPendingOnboarding]);

  const operatorName = session?.user?.name ?? "Operator";
  const operatorInitials =
    (session?.user as { initials?: string })?.initials ??
    operatorName
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  // Onboarding + auth surfaces (login / forgot-password / reset-password)
  // render as their own full-page experiences — no sidebar/topbar, no guards.
  // The page owns its own chrome.
  if (isOnboarding || isAuthPage) {
    return <>{children}</>;
  }

  // Tenant SUSPENDED by the platform admin → block the whole portal. The user is
  // authenticated but no content opens; they see the suspended screen only.
  if (
    status === "authenticated" &&
    (tenantStatus === "suspended" || tenantStatus === "paused")
  ) {
    return (
      <SuspendedWorkspace
        email={session?.user?.email}
        isAdmin={tenantRoles.includes("admin")}
      />
    );
  }

  // Signed out / expired on a protected route → render nothing but a spinner
  // while the effect above redirects to login. This stops the dashboard (and
  // any cached/guest data) from flashing for an unauthenticated browser.
  if (status === "unauthenticated") {
    return (
      <div className="min-h-[100dvh] bg-bg flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-brand" strokeWidth={2} aria-hidden />
        <p className="font-body text-[13px] text-text-tertiary">Redirecting to sign in…</p>
      </div>
    );
  }

  // Avoid flashing enterprise chrome while session resolves in the reviewer sub-portal.
  if (inReviewerArea && status === "loading") {
    return (
      <div className="min-h-[100dvh] bg-bg flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-brand" strokeWidth={2} aria-hidden />
        <p className="font-body text-[13px] text-text-tertiary">Loading workspace…</p>
      </div>
    );
  }

  return (
    <AuroraShell
      config={navConfig}
      brandSubtitle="Enterprise"
      operator={{
        name: operatorName,
        initials: operatorInitials,
        email: session?.user?.email ?? undefined,
      }}
    >
      {!ENTERPRISE_DEMO_BYPASS && <EnterpriseGuard isReviewer={inReviewerArea} />}
      <TenantStatusBanner skip={skipSubscription} />
      <SubscriptionRouteGate skip={skipSubscription}>
        {!isReviewer ? (
          <EnterpriseAccessGate>{children}</EnterpriseAccessGate>
        ) : (
          children
        )}
      </SubscriptionRouteGate>
    </AuroraShell>
  );
}
