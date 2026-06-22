/**
 * Map ContributorProfile (onboarding persistence) → profile UI models.
 * Profile overview must reflect what onboarding captured — not static mocks.
 */

import type { ContributorTrackProfile } from "@/lib/contributor/profile-status";
import type { MockSkill } from "@/mocks/contributor";

export interface ProfileAvailability {
  hoursPerWeek: number;
  timezone: string;
}

function slugSkillId(name: string): string {
  return `skill-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

/** Decode breadcrumb label from a track-derived skill id (`skill-react` → React). */
export function skillLabelFromId(id: string): string | null {
  if (!id.startsWith("skill-")) return null;
  const slug = id.slice("skill-".length);
  if (!slug) return null;
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function findSkillById(skills: MockSkill[], id: string): MockSkill | undefined {
  return skills.find((s) => s.id === id);
}

/** Infer display level from onboarding tier arrays (§5.B.4). */
function levelForTier(tier: "primary" | "secondary" | "other"): MockSkill["level"] {
  if (tier === "primary") return "L3";
  if (tier === "secondary") return "L2";
  return "L1";
}

export function skillsFromTrackProfile(
  profile: ContributorTrackProfile | null | undefined,
): MockSkill[] {
  if (!profile) return [];

  const items: MockSkill[] = [];
  const seen = new Set<string>();

  const add = (names: string[], tier: "primary" | "secondary" | "other") => {
    for (const name of names) {
      const trimmed = name.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        id: slugSkillId(trimmed),
        name: trimmed,
        level: levelForTier(tier),
        category: "engineering",
        tasksCompletedWithThisSkill: 0,
        evidenceCount: 0,
      });
    }
  };

  add(profile.primarySkills ?? [], "primary");

  return items;
}

export function availabilityFromTrackProfile(
  profile: ContributorTrackProfile | null | undefined,
): ProfileAvailability {
  const hours = Number.parseInt(profile?.availability ?? "", 10);
  return {
    hoursPerWeek: Number.isFinite(hours) && hours > 0 ? hours : 0,
    timezone: profile?.timezone?.trim() || "UTC",
  };
}

export function studentInstitutionLabel(
  profile: ContributorTrackProfile | null | undefined,
): string | null {
  if (!profile) return null;
  const parts = [profile.degree?.trim(), profile.branch?.trim()].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}
