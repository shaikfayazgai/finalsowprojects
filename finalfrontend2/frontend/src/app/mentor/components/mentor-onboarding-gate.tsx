"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useActiveMentor } from "@/lib/hooks/use-active-mentor";

const MENTOR_DEMO_BYPASS = process.env.NEXT_PUBLIC_MENTOR_DEMO === "1";

/** Redirect mentors who have not finished onboarding (except on the onboarding page itself). */
export function MentorOnboardingGate() {
  const pathname = usePathname();
  const router = useRouter();
  const { onboardingComplete, loading } = useActiveMentor();

  useEffect(() => {
    if (MENTOR_DEMO_BYPASS) return;
    if (loading || pathname.startsWith("/mentor/onboarding")) return;
    if (!onboardingComplete) {
      router.replace("/mentor/onboarding");
    }
  }, [loading, onboardingComplete, pathname, router]);

  return null;
}
