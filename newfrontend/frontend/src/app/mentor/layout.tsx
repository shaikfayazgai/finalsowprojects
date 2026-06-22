"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { EnterpriseShell } from "@/components/meridian";
import { useRoleGuard } from "@/lib/hooks/use-role-guard";
import { useMentorNavConfig } from "@/lib/hooks/use-mentor-nav";
import { useActiveMentor } from "@/lib/hooks/use-active-mentor";
import { MentorOnboardingGate } from "@/app/mentor/components/mentor-onboarding-gate";

const MENTOR_DEMO_BYPASS = process.env.NEXT_PUBLIC_MENTOR_DEMO === "1";

function MentorGuard() {
  useRoleGuard(["mentor"]);
  return null;
}

function MentorOnboardingShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {!MENTOR_DEMO_BYPASS && <MentorGuard />}
      <Suspense fallback={null}>{children}</Suspense>
    </>
  );
}

function MentorPortalShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const config = useMentorNavConfig();
  const { onboardingComplete, loading: mentorLoading } = useActiveMentor();
  const operatorName = session?.user?.name ?? "Mentor";
  const operatorInitials =
    (session?.user as { initials?: string })?.initials ??
    operatorName
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  const portalReady =
    MENTOR_DEMO_BYPASS || mentorLoading || onboardingComplete;

  return (
    <EnterpriseShell
      config={config}
      operator={{
        name: operatorName,
        initials: operatorInitials,
        email: session?.user?.email ?? undefined,
      }}
    >
      {!MENTOR_DEMO_BYPASS && <MentorGuard />}
      {!MENTOR_DEMO_BYPASS && <MentorOnboardingGate />}
      <Suspense fallback={null}>
        {portalReady ? (
          children
        ) : (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-brand" strokeWidth={2} aria-hidden />
            <p className="font-body text-[13px] text-text-tertiary">Loading workspace…</p>
          </div>
        )}
      </Suspense>
    </EnterpriseShell>
  );
}

function MentorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // The portal-scoped sign-in + forced-reset pages render bare — no shell, no
  // role guard, no mentor profile fetch.
  if (pathname.startsWith("/mentor/login") || pathname.startsWith("/mentor/reset-password")) {
    return <>{children}</>;
  }
  const isOnboarding = pathname.startsWith("/mentor/onboarding");
  // Keep onboarding lightweight — avoid mentor profile fetch/nav construction there.
  if (isOnboarding) return <MentorOnboardingShell>{children}</MentorOnboardingShell>;
  return <MentorPortalShell>{children}</MentorPortalShell>;
}

export default function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <MentorShell>{children}</MentorShell>
    </Suspense>
  );
}
