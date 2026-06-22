"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, Suspense } from "react";
import { EnterpriseShell } from "@/components/meridian";
import { contributorNav } from "@/lib/config/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useRoleGuard } from "@/lib/hooks/use-role-guard";
import {
  useContributorTrack,
  trackLoading,
} from "@/lib/hooks/use-contributor-track";
import {
  isInsideOnboardingFlow,
  resolveIncompleteOnboardingPath,
} from "@/lib/contributor/onboarding-routing";
import { readReferralContext } from "@/lib/referral/context";
import { PersonaSwitcher } from "@/components/contributor/persona-switcher";

const CONTRIBUTOR_DEMO_BYPASS = process.env.NEXT_PUBLIC_CONTRIBUTOR_DEMO === "1";

function ContributorGuard() {
  useRoleGuard(["contributor"]);
  return null;
}

// Public contributor entry routes render WITHOUT the portal shell + role guard —
// otherwise the guard bounces logged-out / wrong-role visitors away from the
// contributor login itself (they'd never reach it). These pages bring their own
// full-screen layout.
const CONTRIBUTOR_PUBLIC_ROUTES = ["/contributor/login", "/contributor/forgot-password"];

function isContributorPublicRoute(pathname: string): boolean {
  return CONTRIBUTOR_PUBLIC_ROUTES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export default function ContributorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Render the login / forgot-password pages standalone. The default export only
  // calls usePathname() in this branch, so hook order stays stable across routes
  // (all portal hooks live in ContributorPortalLayout, which mounts as a unit).
  if (isContributorPublicRoute(pathname)) {
    return <>{children}</>;
  }
  return <ContributorPortalLayout>{children}</ContributorPortalLayout>;
}

function ContributorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);
  const isOnboardingRoute = pathname.startsWith("/contributor/onboarding");
  const trackQuery = useContributorTrack();
  const trackReady = status === "authenticated" && !trackLoading(status, trackQuery);

  useEffect(() => {
    if (!trackReady || !trackQuery.data) return;
    setOnboardingComplete(trackQuery.data.onboardingComplete);
  }, [trackReady, trackQuery.data, setOnboardingComplete]);

  const needsOnboarding =
    trackReady && trackQuery.data && !trackQuery.data.onboardingComplete;

  const needsKycReview =
    trackReady &&
    trackQuery.data?.onboardingComplete &&
    !trackQuery.data.portalReady;

  // Legacy SSO route → unified Meridian onboarding (page children were hidden here).
  useEffect(() => {
    if (!trackReady || pathname !== "/contributor/onboarding") return;
    const user = session?.user as
      | { provider?: string; isNewSsoUser?: boolean }
      | undefined;
    router.replace(
      resolveIncompleteOnboardingPath({
        provider: user?.provider,
        isNewSsoUser: user?.isNewSsoUser,
        contribType: trackQuery.data?.contribType,
        referral: readReferralContext(),
        isInternalEmployee: trackQuery.data?.onboardingTrack === "internal",
      }),
    );
  }, [trackReady, pathname, router, session, trackQuery.data]);

  // Register / referral users belong in `/onboarding/*`, not the portal shell.
  useEffect(() => {
    if (!needsOnboarding || isInsideOnboardingFlow(pathname)) return;

    const user = session?.user as
      | { provider?: string; isNewSsoUser?: boolean }
      | undefined;
    const target = resolveIncompleteOnboardingPath({
      provider: user?.provider,
      isNewSsoUser: user?.isNewSsoUser,
      contribType: trackQuery.data?.contribType,
      referral: readReferralContext(),
    });

    const targetPath = target.split("?")[0] ?? target;
    if (pathname !== targetPath && !pathname.startsWith(targetPath)) {
      router.replace(target);
    }
  }, [needsOnboarding, pathname, router, session, trackQuery.data]);

  // Onboarding done but KYC not cleared — hold outside the portal shell.
  useEffect(() => {
    if (!needsKycReview || isInsideOnboardingFlow(pathname)) return;
    router.replace("/onboarding/kyc-pending");
  }, [needsKycReview, pathname, router]);

  const operatorName = session?.user?.name ?? "Contributor";
  const operatorInitials =
    (session?.user as { initials?: string })?.initials ??
    operatorName
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const shellChildren =
    status === "authenticated" && trackLoading(status, trackQuery)
      ? null
      : needsOnboarding && !isOnboardingRoute
        ? null
        : needsKycReview
          ? null
          : children;

  return (
    <>
      <EnterpriseShell
        config={contributorNav}
        operator={{
          name: operatorName,
          initials: operatorInitials,
          email: session?.user?.email ?? undefined,
        }}
      >
        {!CONTRIBUTOR_DEMO_BYPASS && <ContributorGuard />}
        <Suspense fallback={null}>{shellChildren}</Suspense>
      </EnterpriseShell>
      {!needsOnboarding && CONTRIBUTOR_DEMO_BYPASS && (
        <Suspense fallback={null}>
          <PersonaSwitcher />
        </Suspense>
      )}
    </>
  );
}
