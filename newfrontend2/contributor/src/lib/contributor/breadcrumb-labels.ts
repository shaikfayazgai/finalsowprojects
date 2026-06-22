/**
 * Human-readable labels for contributor topbar breadcrumbs on dynamic routes.
 */

import { MOCK_CREDENTIALS } from "@/mocks/contributor/credentials";
import { skillLabelFromId } from "@/lib/contributor/profile-from-track";
import { MOCK_TASKS } from "@/mocks/contributor/tasks";

export function resolveContributorSegmentLabel(
  pathBefore: string,
  segment: string,
): string | null {
  if (pathBefore.endsWith("/profile/skills") || pathBefore.includes("/profile/skills/")) {
    const label = skillLabelFromId(segment);
    if (label) return label;
  }

  if (pathBefore.endsWith("/credentials") || pathBefore.includes("/credentials/")) {
    const cred = MOCK_CREDENTIALS.find((c) => c.id === segment);
    if (cred) return cred.taskTitle;
  }

  if (
    pathBefore.endsWith("/tasks") ||
    pathBefore.includes("/tasks/") ||
    pathBefore.endsWith("/contributor/tasks")
  ) {
    const task = MOCK_TASKS.find((t) => t.id === segment);
    if (task) return task.title;
  }

  return null;
}

export function humanizePathSegment(segment: string): string {
  const stripped = segment
    .replace(/^(prj|sow|plan|po|t|task|sub|skill|cred)-/, "")
    .replace(/-/g, " ");
  if (!stripped) return segment;
  return stripped.replace(/\b\w/g, (c) => c.toUpperCase());
}
