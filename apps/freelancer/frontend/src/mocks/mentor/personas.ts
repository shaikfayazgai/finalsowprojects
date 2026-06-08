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
    id: "",
    displayName: "",
    firstName: "",
    email: "",
    avatarInitials: "",
    title: "Mentor",
    country: "",
    timezone: "",
    joinedAt: "",
    bio: "",
    mentorshipIntro: "",
    languages: [],
    competency: [],
    pools: [],
    capacityPerWeek: 0,
    status: "available",
  },
  "mentor.senior": {
    role: "mentor.senior",
    id: "",
    displayName: "",
    firstName: "",
    email: "",
    avatarInitials: "",
    title: "Senior Mentor",
    country: "",
    timezone: "",
    joinedAt: "",
    bio: "",
    mentorshipIntro: "",
    languages: [],
    competency: [],
    pools: [],
    capacityPerWeek: 0,
    status: "available",
  },
  "mentor.lead": {
    role: "mentor.lead",
    id: "",
    displayName: "",
    firstName: "",
    email: "",
    avatarInitials: "",
    title: "Lead Mentor",
    country: "",
    timezone: "",
    joinedAt: "",
    bio: "",
    mentorshipIntro: "",
    languages: [],
    competency: [],
    pools: [],
    capacityPerWeek: 0,
    status: "available",
  },
};

export function isMentorRole(s: string | null | undefined): s is MentorRole {
  return s === "mentor" || s === "mentor.senior" || s === "mentor.lead";
}
