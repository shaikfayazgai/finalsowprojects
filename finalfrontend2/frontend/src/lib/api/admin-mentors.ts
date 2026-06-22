/**
 * Admin mentor API — fetches from the real backend via the FE proxy.
 * Proxy: /api/superadmin/mentors  →  gateway /api/superadmin/mentors
 * Backend shape (login_accounts + _mentor_out):
 *   { id, email, name, firstName, lastName, role, isActive, createdAt,
 *     lastLoginAt, roles[], pools[], status, activeSince,
 *     reviews30d, sessions30d, escalations30d, avgReviewMin, slaHitPct }
 *
 * Component shape (MockAdminMentor):
 *   { id, name, email, country, roles[], pools[], status, activeSince,
 *     reviews30d, sessions30d, escalations30d, avgReviewMin, slaHitPct }
 */

import type {
  AdminMentorStatus,
  MockAdminMentor,
  MockCompetencyRow,
} from "@/mocks/admin/mentors";

// ── Raw backend shape ────────────────────────────────────────────────────────

interface RawMentor {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
  lastLoginAt?: string | null;
  // pre-shaped fields from _mentor_out
  roles?: string[];
  pools?: string[];
  status?: string;
  activeSince?: string;
  reviews30d?: number;
  sessions30d?: number;
  escalations30d?: number;
  avgReviewMin?: number;
  slaHitPct?: number;
  // not stored on login_accounts yet — may come later
  country?: string;
}

// ── Mapper: backend row → MockAdminMentor ────────────────────────────────────

function mapMentor(raw: RawMentor): MockAdminMentor {
  const validStatuses: AdminMentorStatus[] = [
    "active",
    "pending",
    "paused",
    "suspended",
    "closed",
  ];
  const status: AdminMentorStatus =
    validStatuses.includes(raw.status as AdminMentorStatus)
      ? (raw.status as AdminMentorStatus)
      : "active";

  const validRoles = ["mentor", "mentor.senior", "mentor.lead"] as const;
  type MentorRole = (typeof validRoles)[number];
  const roles: MentorRole[] = ((raw.roles ?? []) as string[]).filter(
    (r): r is MentorRole => (validRoles as readonly string[]).includes(r),
  );
  if (roles.length === 0) roles.push("mentor");

  const name =
    raw.name ||
    [raw.firstName, raw.lastName].filter(Boolean).join(" ") ||
    raw.email;

  return {
    id: raw.id,
    name,
    email: raw.email,
    country: raw.country ?? "",
    roles,
    pools: raw.pools ?? [],
    status,
    activeSince: raw.activeSince ?? raw.createdAt ?? new Date().toISOString(),
    reviews30d: raw.reviews30d ?? 0,
    sessions30d: raw.sessions30d ?? 0,
    escalations30d: raw.escalations30d ?? 0,
    avgReviewMin: raw.avgReviewMin ?? 0,
    slaHitPct: raw.slaHitPct ?? 0,
  };
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

/** GET /api/superadmin/mentors — list all mentors. */
export async function fetchAdminMentors(): Promise<MockAdminMentor[]> {
  const res = await fetch("/api/superadmin/mentors", { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch mentors: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { items?: RawMentor[] };
  return (data.items ?? []).map(mapMentor);
}

/** GET /api/superadmin/mentors/:id — single mentor + competency. */
export async function fetchAdminMentor(
  mentorId: string,
): Promise<{ mentor: MockAdminMentor; competency: MockCompetencyRow[] }> {
  const res = await fetch(`/api/superadmin/mentors/${encodeURIComponent(mentorId)}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch mentor: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { mentor?: RawMentor; competency?: MockCompetencyRow[] };
  if (!data.mentor) throw new Error("Mentor not found");
  return {
    mentor: mapMentor(data.mentor),
    competency: data.competency ?? [],
  };
}
