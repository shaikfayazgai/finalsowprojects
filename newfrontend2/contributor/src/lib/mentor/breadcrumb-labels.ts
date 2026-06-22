/**
 * Human-readable labels for mentor topbar breadcrumbs on dynamic routes.
 */

import { getMockDecision } from "@/mocks/mentor/decisions";
import { getMockEscalation } from "@/mocks/mentor/escalations";
import { getMockReview } from "@/mocks/mentor/reviews";
import { getMockSession } from "@/mocks/mentor/sessions";

const STATIC_LABELS: Record<string, string> = {
  profile: "Profile",
  edit: "Edit profile",
  settings: "Settings",
  account: "Account",
  password: "Password",
  privacy: "Privacy",
  availability: "Availability",
  notifications: "Notifications",
  metrics: "Personal metrics",
  diff: "Version diff",
  audit: "Audit log",
  onboarding: "Onboarding",
};

export function resolveMentorSegmentLabel(
  pathBefore: string,
  segment: string,
): string | null {
  if (STATIC_LABELS[segment]) return STATIC_LABELS[segment];

  if (pathBefore.endsWith("/queue") || pathBefore.includes("/queue/")) {
    const review = getMockReview(segment);
    if (review) return review.taskTitle;
  }

  if (pathBefore.endsWith("/history") || pathBefore.includes("/history/")) {
    const decision = getMockDecision(segment);
    if (decision) return decision.taskTitle;
  }

  if (pathBefore.endsWith("/escalation") || pathBefore.includes("/escalation/")) {
    const escalation = getMockEscalation(segment);
    if (escalation) return escalation.taskTitle;
  }

  if (pathBefore.endsWith("/mentorship") || pathBefore.includes("/mentorship/")) {
    const session = getMockSession(segment);
    if (session) return session.contributorName;
  }

  return null;
}
