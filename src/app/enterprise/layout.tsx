"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { AppShell } from "@/components/layout";
import { enterpriseNav, reviewerNav } from "@/lib/config/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import OnboardingModal from "./onboarding/components/OnboardingModal";

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
  const isReviewer = pathname.startsWith("/enterprise/reviewer");

  const provider = (session?.user as { provider?: string })?.provider;
  const isSSO = provider === "google" || provider === "microsoft-entra-id";

  // Clear stale pendingOnboarding flag when a non-SSO (manual) user is detected.
  useEffect(() => {
    if (status === "authenticated" && !isSSO && pendingOnboarding) {
      setPendingOnboarding(false);
    }
  }, [status, isSSO, pendingOnboarding, setPendingOnboarding]);

  const showOnboarding = status === "authenticated" && (isOnboarding || pendingOnboarding) && isSSO;

  return (
    <>
      <AppShell config={isReviewer ? reviewerNav : enterpriseNav}>
        {isOnboarding ? null : children}
      </AppShell>
      {showOnboarding && <OnboardingModal />}
    </>
  );
}