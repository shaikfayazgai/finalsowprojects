"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { AppShell } from "@/components/layout";
import { contributorNav } from "@/lib/config/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useRoleGuard } from "@/lib/hooks/use-role-guard";
import OnboardingModal from "./onboarding/components/OnboardingModal";

export default function ContributorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useRoleGuard(["contributor"]);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isOnboardingComplete = useAuthStore((s) => s.isOnboardingComplete);
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);
  const isOnboarding = pathname.startsWith("/contributor/onboarding");

  const provider = (session?.user as { provider?: string })?.provider;
  const isSSO = provider === "google" || provider === "microsoft-entra-id";

  // Manual (credentials) registrations complete their profile during the 4-step form,
  // so mark onboarding as done immediately — wizard is only for SSO users.
  useEffect(() => {
    if (status === "authenticated" && !isSSO && !isOnboardingComplete) {
      setOnboardingComplete(true);
    }
  }, [status, isSSO, isOnboardingComplete, setOnboardingComplete]);

  const showOnboarding = status === "authenticated" && isSSO && (isOnboarding || !isOnboardingComplete);

  return (
    <>
      <AppShell config={contributorNav}>
        {isOnboarding ? null : children}
      </AppShell>
      {showOnboarding && <OnboardingModal />}
    </>
  );
}
