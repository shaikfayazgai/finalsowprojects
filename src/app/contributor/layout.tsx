"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout";
import { contributorNav } from "@/lib/config/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import OnboardingModal from "./onboarding/components/OnboardingModal";

export default function ContributorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isOnboardingComplete = useAuthStore((s) => s.isOnboardingComplete);
  const isOnboarding = pathname.startsWith("/contributor/onboarding");

  return (
    <>
      <AppShell config={contributorNav}>
        {isOnboarding ? null : children}
      </AppShell>
      {(isOnboarding || !isOnboardingComplete) && <OnboardingModal />}
    </>
  );
}
