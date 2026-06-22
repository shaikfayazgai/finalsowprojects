import { listAdminMentors, getMentorCompetency } from "@/lib/admin/mocks/mentors-service";
import { getProfileOverrides } from "@/lib/mentor/runtime-store";
import {
  MOCK_MENTORS,
  type MentorProfile,
  type MentorRole,
} from "@/mocks/mentor/personas";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

/**
 * Build the active mentor profile from session identity + admin mock data + runtime overlays.
 */
export function buildMentorProfile(input: {
  userId: string;
  email: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role: MentorRole;
}): MentorProfile {
  const template = MOCK_MENTORS[input.role];
  const displayName =
    [input.firstName, input.lastName].filter(Boolean).join(" ").trim() ||
    input.name?.trim() ||
    input.email.split("@")[0]!;
  const firstName = input.firstName?.trim() || displayName.split(/\s+/)[0] || "Mentor";
  const admin = listAdminMentors().find(
    (m) => m.email.toLowerCase() === input.email.toLowerCase(),
  );
  const competencyRows = admin ? getMentorCompetency(admin.id) : [];
  const overrides = getProfileOverrides(input.userId);

  const competency =
    competencyRows.length > 0
      ? competencyRows.map((row) => {
          const mins: number[] = [];
          if (row.levels.L1) mins.push(1);
          if (row.levels.L2) mins.push(2);
          if (row.levels.L3) mins.push(3);
          if (row.levels.L4) mins.push(4);
          const levelMin = (Math.min(...mins, 4) || 1) as 1 | 2 | 3 | 4;
          const levelMax = (Math.max(...mins, 1) || 4) as 1 | 2 | 3 | 4;
          return { skill: row.skillName, levelMin, levelMax };
        })
      : template.competency;

  return {
    ...template,
    role: input.role,
    id: admin?.id ?? template.id,
    displayName,
    firstName,
    email: input.email,
    avatarInitials: initialsFromName(displayName),
    title: admin?.roles.includes("mentor.lead")
      ? "Lead Mentor"
      : admin?.roles.includes("mentor.senior")
        ? "Senior Mentor"
        : template.title,
    country: admin?.country ?? template.country,
    joinedAt: admin?.activeSince ?? template.joinedAt,
    pools: admin?.pools.length ? admin.pools : template.pools,
    competency,
    bio: overrides?.bio ?? template.bio,
    mentorshipIntro: overrides?.mentorshipIntro ?? template.mentorshipIntro,
    languages: overrides?.languages ?? template.languages,
    timezone: overrides?.timezone ?? template.timezone,
  };
}
