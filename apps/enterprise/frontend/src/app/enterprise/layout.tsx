"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { EnterpriseShell } from "@/components/meridian";
import {
  SubscriptionRouteGate,
  TenantStatusBanner,
} from "@/components/enterprise/subscription/SubscriptionGate";
import { enterpriseNav, reviewerNav } from "@/lib/config/navigation";
import { filterEnterpriseNav } from "@/lib/subscription/nav-gates";
import { useTenantSubscription } from "@/lib/hooks/use-tenant-subscription";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useRoleGuard } from "@/lib/hooks/use-role-guard";

// Enterprise Portal V2 redesign branch only: when NEXT_PUBLIC_ENTERPRISE_DEMO=1
// the role guard is skipped so stakeholders can walk the new IA without a
// backend session. Revert before merging to main.
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
  const { data: session, status } = useSession();
  const pendingOnboarding = useAuthStore((s) => s.pendingOnboarding);
  const setPendingOnboarding = useAuthStore((s) => s.setPendingOnboarding);
  const isOnboarding = pathname.startsWith("/enterprise/onboarding");
  const inReviewerArea = pathname.startsWith("/enterprise/reviewer");
  const sessionRole = (session?.user as { role?: string } | undefined)?.role;
  // Only swap to the reviewer sidebar/IA for actual reviewer-role users;
  // an enterprise admin browsing /enterprise/reviewer/* keeps the enterprise
  // sidebar so it doesn't feel like a different portal.
  const isReviewer = inReviewerArea && sessionRole === "reviewer";
  // Skip subscription for reviewer users; also skip while role is unresolved inside
  // the reviewer IA so a hard refresh doesn't fire /api/enterprise/subscription
  // before the JWT role is hydrated (reviewer role → 403).
  const skipSubscription =
    isReviewer ||
    (inReviewerArea &&
      sessionRole !== "enterprise" &&
      sessionRole !== "admin" &&
      sessionRole !== "super_admin");

  const { data: subscription } = useTenantSubscription({ enabled: !skipSubscription });
  const navConfig = useMemo(() => {
    if (isReviewer) return reviewerNav;
    return filterEnterpriseNav(enterpriseNav, subscription ?? undefined);
  }, [isReviewer, subscription]);

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

  // The /enterprise/login (and any /*/login) is a public sign-in screen — render
  // it bare, with no sidebar/topbar and no role guard (which would show the
  // dashboard shell around the login and bounce unauthenticated users to home).
  if (pathname.endsWith("/login")) {
    return <>{children}</>;
  }

  // Onboarding renders as its own full-page experience — no sidebar/topbar.
  // The page owns its own chrome.
  if (isOnboarding) {
    return <>{children}</>;
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
    <EnterpriseShell
      config={navConfig}
      operator={{
        name: operatorName,
        initials: operatorInitials,
        email: session?.user?.email ?? undefined,
      }}
    >
      {!ENTERPRISE_DEMO_BYPASS && <EnterpriseGuard isReviewer={inReviewerArea} />}
      <TenantStatusBanner skip={skipSubscription} />
      <SubscriptionRouteGate skip={skipSubscription}>{children}</SubscriptionRouteGate>
    </EnterpriseShell>
  );
}
