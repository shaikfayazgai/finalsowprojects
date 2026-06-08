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

export const PERSONAS: Array<{ key: Persona; label: string; shortLabel: string }> = [];

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
    displayName: "Anjali Reddy",
    firstName: "Anjali",
    email: "anjali.reddy@acme.com",
    avatarInitials: "AR",
    joinedAt: "2025-09-12",
    country: "India",
    timezone: "Asia/Kolkata",
    orgChip: { tenant: "Acme Corp", department: "Design org" },
  },
  freelancer: {
    persona: "freelancer",
    displayName: "Kavi Senthil",
    firstName: "Kavi",
    email: "kavi.s@example.com",
    avatarInitials: "KS",
    joinedAt: "2026-04-04",
    country: "India",
    timezone: "Asia/Kolkata",
  },
  student: {
    persona: "student",
    displayName: "Meera Prakash",
    firstName: "Meera",
    email: "meera.p@students.annauniv.edu",
    avatarInitials: "MP",
    joinedAt: "2026-01-18",
    country: "India",
    timezone: "Asia/Kolkata",
    supervision: {
      supervisorName: "Dr. Murthy",
      institution: "Anna University",
      supervisorEmail: "lakshmi@annauniv.edu",
      isApproved: true,
      approvedAt: "2026-01-22",
      creditTasksTotal: 0,
      creditTasksCompleted: 0,
      termEndsAt: null,
    },
  },
  women: {
    persona: "women",
    displayName: "Priya Iyer",
    firstName: "Priya",
    email: "priya.iyer@example.com",
    avatarInitials: "PI",
    joinedAt: "2026-02-10",
    country: "India",
    timezone: "Asia/Kolkata",
    womenSupport: {
      peerMentor: { name: "Lakshmi Ananth", initials: "LA" },
      nextCheckIn: { iso: "2026-05-30T11:00:00+05:30", durationMin: 30 },
      activePreferences: [
        "Short-session tasks (≤2h blocks) preferred",
        "Women reviewers when available",
      ],
    },
  },
};

export function isPersona(s: string | null | undefined): s is Persona {
  return s === "internal" || s === "freelancer" || s === "student" || s === "women";
}
