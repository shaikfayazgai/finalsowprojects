/**
 * Mentor personas — spec doc 03 §1.2.
 *
 * 3 mentor personas: base mentor, senior mentor, lead mentor (mentor coach).
 * Senior+ unlock escalation visibility. Lead unlocks team-load module.
 * URL ?persona= flips identity during the mock phase.
 */

export type MentorRole = "mentor" | "mentor.senior" | "mentor.lead";

export interface MentorCompetency {
  skill: string;
  levelMin: 1 | 2 | 3 | 4;
  levelMax: 1 | 2 | 3 | 4;
}

export interface MentorProfile {
  role: MentorRole;
  id: string;
  displayName: string;
  firstName: string;
  email: string;
  avatarInitials: string;
  title: string;
  country: string;
  timezone: string;
  joinedAt: string;
  bio: string;
  mentorshipIntro: string;
  languages: string[];
  competency: MentorCompetency[];
  pools: string[];
  capacityPerWeek: number;
  status: "available" | "ooo" | "off_today";
}

export const MENTOR_ROLES: Array<{ key: MentorRole; label: string }> = [
  { key: "mentor",        label: "Mentor" },
  { key: "mentor.senior", label: "Senior mentor" },
  { key: "mentor.lead",   label: "Lead mentor" },
];

export const MOCK_MENTORS: Record<MentorRole, MentorProfile> = {
  "mentor": {
    role: "mentor",
    id: "mentor-amelia",
    displayName: "Amelia Stone",
    firstName: "Amelia",
    email: "amelia@glimmora.ai",
    avatarInitials: "AS",
    title: "Mentor · Accessibility",
    country: "UK",
    timezone: "Europe/London",
    joinedAt: "2025-08-04",
    bio: "Accessibility specialist focused on inclusive component design and WCAG conformance reviews.",
    mentorshipIntro: "I help contributors think through accessibility decisions in design system work. Short sessions, concrete examples.",
    languages: ["English"],
    competency: [
      { skill: "Accessibility / WCAG", levelMin: 2, levelMax: 4 },
      { skill: "React", levelMin: 1, levelMax: 3 },
      { skill: "Figma", levelMin: 1, levelMax: 3 },
    ],
    pools: ["Helios review mentors"],
    capacityPerWeek: 15,
    status: "available",
  },
  "mentor.senior": {
    role: "mentor.senior",
    id: "mentor-priya",
    displayName: "Priya Iyer",
    firstName: "Priya",
    email: "priya@glimmora.ai",
    avatarInitials: "PI",
    title: "Senior Mentor · Design Systems",
    country: "India",
    timezone: "Asia/Kolkata",
    joinedAt: "2025-01-15",
    bio: "Design-systems lead with 10+ years in inclusive product UI. Reviews React/Figma/A11y; adjudicates contributor disputes.",
    mentorshipIntro: "I work best with contributors planning the L3 → L4 transition. I emphasise rubric-aware self-review.",
    languages: ["English", "Hindi", "Tamil"],
    competency: [
      { skill: "React",                 levelMin: 1, levelMax: 4 },
      { skill: "Figma",                 levelMin: 1, levelMax: 4 },
      { skill: "Accessibility / WCAG",  levelMin: 2, levelMax: 4 },
      { skill: "TypeScript",            levelMin: 2, levelMax: 3 },
    ],
    pools: ["Helios review mentors"],
    capacityPerWeek: 25,
    status: "available",
  },
  "mentor.lead": {
    role: "mentor.lead",
    id: "mentor-yusuf",
    displayName: "Yusuf Okafor",
    firstName: "Yusuf",
    email: "yusuf@glimmora.ai",
    avatarInitials: "YO",
    title: "Lead Mentor · Helios pool",
    country: "Nigeria",
    timezone: "Africa/Lagos",
    joinedAt: "2024-09-22",
    bio: "Lead mentor coordinating the Helios pool. Balances queue load + onboarding new mentors.",
    mentorshipIntro: "Coaching on review consistency and decision-explanation quality for new mentors.",
    languages: ["English"],
    competency: [
      { skill: "React",      levelMin: 1, levelMax: 4 },
      { skill: "TypeScript", levelMin: 1, levelMax: 4 },
      { skill: "Postgres",   levelMin: 2, levelMax: 4 },
    ],
    pools: ["Helios review mentors"],
    capacityPerWeek: 20,
    status: "available",
  },
};

export function isMentorRole(s: string | null | undefined): s is MentorRole {
  return s === "mentor" || s === "mentor.senior" || s === "mentor.lead";
}
