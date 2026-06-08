/**
 * Human-readable labels for reviewer topbar breadcrumbs on dynamic routes.
 */

import { getReviewerItem } from "@/lib/mocks/reviewer-runtime-store";

export function resolveReviewerSegmentLabel(
  pathBefore: string,
  segment: string,
): string | null {
  if (segment === "profile") return "Profile";
  if (segment === "notifications") return "Notifications";

  if (
    pathBefore.endsWith("/queue") ||
    pathBefore.includes("/queue/") ||
    pathBefore.endsWith("/enterprise/reviewer/queue")
  ) {
    const review = getReviewerItem(segment);
    if (review) return review.taskTitle;
  }

  return null;
}
