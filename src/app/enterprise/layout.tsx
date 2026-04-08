"use client";

import { usePathname } from "next/navigation";
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
  const pendingOnboarding = useAuthStore((s) => s.pendingOnboarding);
  const isOnboarding = pathname.startsWith("/enterprise/onboarding");
  const isReviewer = pathname.startsWith("/enterprise/reviewer");
  const showOnboarding = isOnboarding || pendingOnboarding;

  return (
    <>
      <AppShell config={isReviewer ? reviewerNav : enterpriseNav}>
        {isOnboarding ? null : children}
      </AppShell>
      {showOnboarding && <OnboardingModal />}
    </>
  );
}