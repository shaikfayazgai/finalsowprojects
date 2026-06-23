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
import { useProfileCompletion } from "@/lib/hooks/use-profile-completion";
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
const CONTRIBUTOR_PUBLIC_ROUTES = ["/contributor/login", "/contributor/register", "/contributor/forgot-password"];

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
  const trackQuery = useContributorTrack();
  const { data: completion } = useProfileCompletion();

  useEffect(() => {
    if (status === "authenticated" && trackQuery.data) {
      setOnboardingComplete(trackQuery.data.onboardingComplete);
    }
  }, [status, trackQuery.data, setOnboardingComplete]);

  // ── Locked-shell gate ──────────────────────────────────────────────────────
  // Replaces the old full-screen onboarding wizard. After login the contributor
  // lands in the portal SHELL, but until their profile is 100% complete they can
  // only be on a Profile page — every other section is locked and bounces back to
  // the profile-completion page (which carries the whole filling form: agreements,
  // identity, payout, skills, projects, experience, education).
  const onProfile = pathname.startsWith("/contributor/profile");
  const profileLoaded = !!completion;
  const profileComplete = completion?.complete ?? false;
  const locked = status === "authenticated" && profileLoaded && !profileComplete;

  useEffect(() => {
    if (locked && !onProfile) {
      router.replace("/contributor/profile/complete");
    }
  }, [locked, onProfile, router]);

  const operatorName = session?.user?.name ?? "Contributor";
  const operatorInitials =
    (session?.user as { initials?: string })?.initials ??
    operatorName
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  // While locked, render only Profile pages; other sections show nothing (they're
  // mid-redirect) so no locked content flashes.
  const shellChildren =
    status === "authenticated" && trackLoading(status, trackQuery) && !profileLoaded
      ? null
      : locked && !onProfile
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
      {!locked && CONTRIBUTOR_DEMO_BYPASS && (
        <Suspense fallback={null}>
          <PersonaSwitcher />
        </Suspense>
      )}
    </>
  );
}
