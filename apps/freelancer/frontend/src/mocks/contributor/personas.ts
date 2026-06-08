/**
 * Contributor personas — spec §1.2.
 *
 * Phase 1 supports four personas. The active persona drives which
 * dashboard module renders (§5.C.3), which onboarding identity step
 * is shown (§5.B.3), payout defaults (§5.L.4), safety prominence
 * (§5.O), and profile fields (§5.K).
 *
 * Persona is read from ContributorProfile.contribType via /api/contributor/track.
 * Demo builds may override with `?persona=` when NEXT_PUBLIC_CONTRIBUTOR_DEMO=1.
 */

export type Persona = "internal" | "freelancer" | "student" | "women";

export const PERSONAS: Array<{ key: Persona; label: string; shortLabel: string }> = [
  { key: "internal", label: "Internal employee", shortLabel: "Internal" },
  { key: "freelancer", label: "External freelancer", shortLabel: "Freelancer" },
  { key: "student", label: "Student", shortLabel: "Student" },
  { key: "women", label: "Women workforce", shortLabel: "Women workforce" },
];

export interface PersonaProfile {
  persona: Persona;
  displayName: string;
  firstName: string;
  email: string;
  avatarInitials: string;
  joinedAt: string;
  country: string;
  timezone: string;

  // Persona-specific bits ------------------------------------------------
  /** Internal employees only — shown as a chip in the dashboard header. */
  orgChip?: { tenant: string; department: string };

  /** Student-only — Supervision module; demo fixtures in MOCK_PROFILES only. */
  supervision?: {
    supervisorName: string;
    institution: string;
    supervisorEmail: string;
    isApproved: boolean;
    approvedAt: string | null;
    creditTasksTotal: number;
    creditTasksCompleted: number;
    termEndsAt: string | null;
  };

  /** Women-workforce only — Your support module; demo fixtures in MOCK_PROFILES only. */
  womenSupport?: {
    peerMentor: { name: string; initials: string };
    nextCheckIn: { iso: string; durationMin: number };
    activePreferences: string[];
    openSafetyCaseRef?: string;
  };
}

export const MOCK_PROFILES: Record<Persona, PersonaProfile> = {
  internal: {
    persona: "internal",
    displayName: "",
    firstName: "",
    email: "",
    avatarInitials: "",
    joinedAt: "",
    country: "",
    timezone: "",
  },
  freelancer: {
    persona: "freelancer",
    displayName: "",
    firstName: "",
    email: "",
    avatarInitials: "",
    joinedAt: "",
    country: "",
    timezone: "",
  },
  student: {
    persona: "student",
    displayName: "",
    firstName: "",
    email: "",
    avatarInitials: "",
    joinedAt: "",
    country: "",
    timezone: "",
  },
  women: {
    persona: "women",
    displayName: "",
    firstName: "",
    email: "",
    avatarInitials: "",
    joinedAt: "",
    country: "",
    timezone: "",
  },
};

export function isPersona(s: string | null | undefined): s is Persona {
  return s === "internal" || s === "freelancer" || s === "student" || s === "women";
}
