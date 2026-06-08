import type { MockSkill } from "@/mocks/contributor";
import type { ContributorTaskMockStatus } from "@/mocks/contributor/tasks";
import type { StatusChipProps } from "@/components/meridian/primitives/StatusChip";
import {
  levelTone,
  primaryRole,
  skillCategoryLabel,
} from "../../lib/profile-ui-utils";

export { levelTone, primaryRole, skillCategoryLabel };

export const SKILL_LEVELS: MockSkill["level"][] = ["L1", "L2", "L3", "L4"];

export const SKILL_CATEGORIES: MockSkill["category"][] = [
  "engineering",
  "design",
  "data",
  "ops",
  "writing",
];

export const CATEGORY_TABS: Array<{ id: "" | MockSkill["category"]; label: string }> = [
  { id: "", label: "All" },
  { id: "engineering", label: "Engineering" },
  { id: "design", label: "Design" },
  { id: "data", label: "Data" },
  { id: "ops", label: "Ops" },
  { id: "writing", label: "Writing" },
];

export function levelDescription(level: MockSkill["level"]): string {
  switch (level) {
    case "L4":
      return "Expert — can lead and review others";
    case "L3":
      return "Advanced — independent delivery";
    case "L2":
      return "Intermediate — guided complex work";
    default:
      return "Beginner — learning with support";
  }
}

export function fmtSkillDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function taskHref(taskId: string, status: ContributorTaskMockStatus): string {
  return status === "completed"
    ? `/contributor/tasks/completed/${taskId}`
    : `/contributor/tasks/${taskId}`;
}

export function taskStatusLabel(status: ContributorTaskMockStatus): string {
  return status.replace(/_/g, " ");
}

export function taskStatusChip(
  status: ContributorTaskMockStatus,
): NonNullable<StatusChipProps["status"]> {
  if (status === "completed") return "success";
  if (status === "rejected") return "error";
  if (status === "under_review" || status === "submitted" || status === "resubmitted") {
    return "info";
  }
  if (status === "feedback_requested" || status === "blocked") {
    return "warning";
  }
  return "neutral";
}

export function skillsSummary(skills: MockSkill[]) {
  const withEvidence = skills.filter((s) => s.evidenceCount > 0).length;
  const reinforced = skills.filter((s) => s.tasksCompletedWithThisSkill > 0).length;
  const topLevel = skills.filter((s) => s.level === "L3" || s.level === "L4").length;
  return { total: skills.length, withEvidence, reinforced, topLevel };
}

export function filterSkills(
  skills: MockSkill[],
  opts: { q?: string; category?: "" | MockSkill["category"] },
): MockSkill[] {
  let result = skills;
  const needle = opts.q?.trim().toLowerCase();
  if (needle) {
    result = result.filter(
      (s) =>
        s.name.toLowerCase().includes(needle) ||
        skillCategoryLabel(s.category).toLowerCase().includes(needle),
    );
  }
  if (opts.category) {
    result = result.filter((s) => s.category === opts.category);
  }
  return result;
}

export function categoryCounts(skills: MockSkill[]): Record<string, number> {
  const counts: Record<string, number> = { "": skills.length };
  for (const cat of SKILL_CATEGORIES) {
    counts[cat] = skills.filter((s) => s.category === cat).length;
  }
  return counts;
}

export function isEvidenceLink(value: string): boolean {
  return /^https?:\/\//.test(value);
}
