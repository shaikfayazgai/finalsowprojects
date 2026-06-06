/**
 * Admin mentor + pool mock service — localStorage overlay (demo persistence).
 * Backend handoff: replace with fetch to /api/admin/mentors/*
 */

import { applyOverlay, createOverlayStore } from "@/lib/enterprise/mocks/overlay";
import {
  MOCK_ADMIN_MENTORS,
  MOCK_MENTOR_POOLS,
  MOCK_MENTOR_COMPETENCY,
  MOCK_POOL_REASSIGN_HISTORY,
  type MockAdminMentor,
  type MockCompetencyRow,
  type MockMentorPool,
  type PoolReassignEvent,
} from "@/mocks/admin/mentors";

const mentorOverlay = createOverlayStore<MockAdminMentor>("glimmora.mock.adminMentors.v1");
const poolOverlay = createOverlayStore<MockMentorPool>("glimmora.mock.adminPools.v1");
const competencyOverlay = createOverlayStore<{ rows: MockCompetencyRow[] }>(
  "glimmora.mock.adminCompetency.v1",
);
const poolHistoryOverlay = createOverlayStore<PoolReassignEvent>(
  "glimmora.mock.adminPoolHistory.v1",
);

export const adminMentorOverlays = {
  mentors: mentorOverlay,
  pools: poolOverlay,
  competency: competencyOverlay,
  poolHistory: poolHistoryOverlay,
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24);
}

function listMentorsMerged(): MockAdminMentor[] {
  return applyOverlay(MOCK_ADMIN_MENTORS, mentorOverlay.read());
}

function listPoolsMerged(): MockMentorPool[] {
  return applyOverlay(MOCK_MENTOR_POOLS, poolOverlay.read());
}

function recalcPoolCounts(): void {
  const mentors = listMentorsMerged();
  for (const pool of listPoolsMerged()) {
    const count = mentors.filter(
      (m) => m.pools.includes(pool.id) && m.status !== "closed",
    ).length;
    if (count !== pool.mentors) {
      poolOverlay.patch(pool.id, { mentors: count });
    }
  }
}

export function listAdminMentors(): MockAdminMentor[] {
  return listMentorsMerged();
}

export function getAdminMentor(id: string): MockAdminMentor | undefined {
  return listMentorsMerged().find((m) => m.id === id);
}

export function listAdminPools(): MockMentorPool[] {
  return listPoolsMerged();
}

export function getAdminPool(id: string): MockMentorPool | undefined {
  return listPoolsMerged().find((p) => p.id === id);
}

export function getMentorCompetency(mentorId: string): MockCompetencyRow[] {
  const o = competencyOverlay.read()[mentorId];
  if (o?.rows) return o.rows;
  return MOCK_MENTOR_COMPETENCY[mentorId] ?? [];
}

/** Admin-side setup done (pools + competency) — distinct from mentor first sign-in. */
export function isMentorAdminSetupComplete(
  mentor: Pick<MockAdminMentor, "id" | "pools">,
  competency?: MockCompetencyRow[],
): boolean {
  const rows = competency ?? getMentorCompetency(mentor.id);
  const hasPools = mentor.pools.length > 0;
  const hasCompetency = rows.some(
    (r) =>
      Boolean(r.skillId) &&
      (r.levels.L1 || r.levels.L2 || r.levels.L3 || r.levels.L4),
  );
  return hasPools && hasCompetency;
}

export function saveMentorCompetency(mentorId: string, rows: MockCompetencyRow[]): void {
  competencyOverlay.insert(mentorId, { rows });
}

export function getPoolReassignHistory(poolId: string): PoolReassignEvent[] {
  const seed = MOCK_POOL_REASSIGN_HISTORY[poolId] ?? [];
  const overlay = poolHistoryOverlay.read();
  const extra = Object.values(overlay).filter(
    (e) => !e.__deletedAt && e.poolId === poolId,
  ) as PoolReassignEvent[];
  return [...seed, ...extra].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
}

export interface InviteMentorInput {
  name: string;
  email: string;
  country: string;
  roles: MockAdminMentor["roles"];
  poolIds: string[];
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
    pools: input.poolIds,
    status: "pending",
    activeSince: new Date().toISOString(),
    reviews30d: 0,
    sessions30d: 0,
    escalations30d: 0,
    avgReviewMin: 0,
    slaHitPct: 0,
  };
  mentorOverlay.insert(id, mentor);
  recalcPoolCounts();
  return mentor;
}

export function updateAdminMentor(
  id: string,
  patch: Partial<Pick<MockAdminMentor, "status" | "roles" | "pools">>,
): MockAdminMentor | undefined {
  const current = getAdminMentor(id);
  if (!current) return undefined;
  mentorOverlay.patch(id, patch);
  recalcPoolCounts();
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

export interface CreatePoolInput {
  name: string;
  scope: MockMentorPool["scope"];
  tenantId?: string;
  tenantName?: string;
  leadMentorId: string;
}

export function createAdminPool(input: CreatePoolInput): MockMentorPool {
  const base = slugify(input.name);
  let id = `p-${base}`;
  let n = 1;
  while (getAdminPool(id)) {
    id = `p-${base}-${n++}`;
  }
  const pool: MockMentorPool = {
    id,
    name: input.name.trim(),
    scope: input.scope,
    tenantId: input.tenantId,
    tenantName: input.tenantName,
    mentors: 0,
    leadMentorId: input.leadMentorId,
    loadPct: 0,
  };
  poolOverlay.insert(id, pool);
  appendPoolReassign(id, null, input.leadMentorId, "Initial lead");
  return pool;
}

export function setPoolLead(
  poolId: string,
  toMentorId: string,
  by = "Platform admin",
  note?: string,
): MockMentorPool | undefined {
  const pool = getAdminPool(poolId);
  if (!pool) return undefined;
  const from = pool.leadMentorId;
  poolOverlay.patch(poolId, { leadMentorId: toMentorId });
  appendPoolReassign(poolId, from, toMentorId, note ?? "Lead changed", by);
  return getAdminPool(poolId);
}

function appendPoolReassign(
  poolId: string,
  fromMentorId: string | null,
  toMentorId: string,
  note: string,
  by = "Platform admin",
): void {
  const id = `pr-${Date.now()}`;
  poolHistoryOverlay.insert(id, {
    id,
    poolId,
    at: new Date().toISOString(),
    fromMentorId,
    toMentorId,
    by,
    note,
  });
}

export function mentorDisplayForAudit(actorQuery: string): string {
  const byId = getAdminMentor(actorQuery);
  if (byId) return byId.name;
  return actorQuery;
}

export function canAssignCrossPool(roles: MockAdminMentor["roles"]): boolean {
  return roles.includes("mentor.senior") || roles.includes("mentor.lead");
}
