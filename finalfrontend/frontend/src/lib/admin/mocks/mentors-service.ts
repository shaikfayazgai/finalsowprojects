/**
 * Admin mentor + pool mock service — localStorage overlay (demo persistence).
 * Backend handoff: replace with fetch to /api/admin/mentors/*
 */

import { applyOverlay, createOverlayStore } from "@/lib/enterprise/mocks/overlay";
import {
  MOCK_ADMIN_MENTORS,
  MOCK_MENTOR_COMPETENCY,
  type MockAdminMentor,
  type MockCompetencyRow,
} from "@/mocks/admin/mentors";

const mentorOverlay = createOverlayStore<MockAdminMentor>("glimmora.mock.adminMentors.v1");
const competencyOverlay = createOverlayStore<{ rows: MockCompetencyRow[] }>(
  "glimmora.mock.adminCompetency.v1",
);

export const adminMentorOverlays = {
  mentors: mentorOverlay,
  competency: competencyOverlay,
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24);
}

function listMentorsMerged(): MockAdminMentor[] {
  return applyOverlay(MOCK_ADMIN_MENTORS, mentorOverlay.read());
}

export function listAdminMentors(): MockAdminMentor[] {
  return listMentorsMerged();
}

export function getAdminMentor(id: string): MockAdminMentor | undefined {
  return listMentorsMerged().find((m) => m.id === id);
}

export function getMentorCompetency(mentorId: string): MockCompetencyRow[] {
  const o = competencyOverlay.read()[mentorId];
  if (o?.rows) return o.rows;
  return MOCK_MENTOR_COMPETENCY[mentorId] ?? [];
}

/** Admin-side setup done (competency) — distinct from mentor first sign-in. */
export function isMentorAdminSetupComplete(
  mentor: Pick<MockAdminMentor, "id">,
  competency?: MockCompetencyRow[],
): boolean {
  const rows = competency ?? getMentorCompetency(mentor.id);
  return rows.some(
    (r) =>
      Boolean(r.skillId) &&
      (r.levels.L1 || r.levels.L2 || r.levels.L3 || r.levels.L4),
  );
}

export function saveMentorCompetency(mentorId: string, rows: MockCompetencyRow[]): void {
  competencyOverlay.insert(mentorId, { rows });
}

export interface InviteMentorInput {
  name: string;
  email: string;
  country: string;
  roles: MockAdminMentor["roles"];
  note?: string;
}

export function inviteAdminMentor(input: InviteMentorInput): MockAdminMentor {
  const base = slugify(input.name.split(" ")[0] ?? "mentor");
  let id = `m-${base}`;
  let n = 1;
  while (getAdminMentor(id)) {
    id = `m-${base}-${n++}`;
  }
  const mentor: MockAdminMentor = {
    id,
    name: input.name.trim(),
    email: input.email.trim(),
    country: input.country,
    roles: input.roles.length ? input.roles : ["mentor"],
    pools: [],
    status: "pending",
    activeSince: new Date().toISOString(),
    reviews30d: 0,
    sessions30d: 0,
    escalations30d: 0,
    avgReviewMin: 0,
    slaHitPct: 0,
  };
  mentorOverlay.insert(id, mentor);
  return mentor;
}

export function updateAdminMentor(
  id: string,
  patch: Partial<Pick<MockAdminMentor, "status" | "roles">>,
): MockAdminMentor | undefined {
  const current = getAdminMentor(id);
  if (!current) return undefined;
  mentorOverlay.patch(id, patch);
  return getAdminMentor(id);
}

export function pauseAdminMentor(id: string): MockAdminMentor | undefined {
  return updateAdminMentor(id, { status: "paused" });
}

export function resumeAdminMentor(id: string): MockAdminMentor | undefined {
  const m = getAdminMentor(id);
  if (!m) return undefined;
  const next = m.status === "pending" ? "pending" : "active";
  return updateAdminMentor(id, { status: next });
}

export function mentorDisplayForAudit(actorQuery: string): string {
  const byId = getAdminMentor(actorQuery);
  if (byId) return byId.name;
  return actorQuery;
}
