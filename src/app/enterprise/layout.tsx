"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout";
import { enterpriseNav } from "@/lib/config/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function EnterpriseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isOnboardingComplete = useAuthStore((s) => s.isOnboardingComplete);
  const isOnboarding = pathname.startsWith("/enterprise/onboarding");

  useEffect(() => {
    if (!isOnboarding && !isOnboardingComplete) {
      router.replace("/enterprise/onboarding");
    }
  }, [isOnboarding, isOnboardingComplete, router]);

  if (isOnboarding) return <>{children}</>;

  return <AppShell config={enterpriseNav}>{children}</AppShell>;
}
