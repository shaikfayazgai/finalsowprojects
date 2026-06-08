"use client";

/**
 * Onboarding layout — approval gate.
 *
 * The /onboarding/* steps (consent, skills, KYC, etc.) must NOT be reachable by
 * an approval-gated account that hasn't been approved yet. A pending/rejected
 * women (or approval-required) contributor sees the "Application under review"
 * wall here too — so they can't slip past the contributor-portal gate by
 * navigating straight to an onboarding URL.
 */

import { useSession } from "next-auth/react";
import { ApprovalStatusScreen } from "@/components/auth/approval-status-screen";

const CONTRIBUTOR_DEMO_BYPASS = process.env.NEXT_PUBLIC_CONTRIBUTOR_DEMO === "1";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const approvalStatus =
    (session?.user as { approvalStatus?: string } | undefined)?.approvalStatus ?? "approved";

  if (status === "authenticated" && !CONTRIBUTOR_DEMO_BYPASS && approvalStatus !== "approved") {
    return <ApprovalStatusScreen status={approvalStatus} />;
  }

  return <>{children}</>;
}
