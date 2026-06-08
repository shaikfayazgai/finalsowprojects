/**
 * Admin · global mentor pool mock — spec doc 04 §5.D.
 * Distinct from the per-tenant mentor portal data: this is the admin-side
 * view across all tenants.
 */

export type AdminMentorStatus = "active" | "pending" | "paused" | "suspended" | "closed";

export interface MockAdminMentor {
  id: string;
  name: string;
  email: string;
  country: string;
  roles: ("mentor" | "mentor.senior" | "mentor.lead")[];
  pools: string[];           // pool ids
  status: AdminMentorStatus;
  activeSince: string;       // ISO
  // 30-day activity
  reviews30d: number;
  sessions30d: number;
  escalations30d: number;
  avgReviewMin: number;
  slaHitPct: number;
}

export interface MockMentorPool {
  id: string;
  name: string;
  scope: "tenant" | "cross-tenant";
  tenantId?: string;         // for tenant-scoped pools
  tenantName?: string;
  mentors: number;
  leadMentorId: string;
  loadPct: number;
}

export interface MockCompetencyRow {
  role: string;
  skillId: string;
  skillName: string;
  levels: { L1: boolean; L2: boolean; L3: boolean; L4: boolean };
}

// No mock/demo mentors. Real mentors (provisioned accounts, e.g. the
// mywebsitebuilt mentor) come from the backend /api/superadmin/mentors — they
// are NOT in this seed. Kept empty so no fabricated mentors/pools appear.
export const MOCK_ADMIN_MENTORS: MockAdminMentor[] = [];

export const MOCK_MENTOR_POOLS: MockMentorPool[] = [];

// Competency matrix per mentor — empty (no demo mentors to seed).
export const MOCK_MENTOR_COMPETENCY: Record<string, MockCompetencyRow[]> = {};

export interface MockMentorActivityItem {
  at: string;
  kind: "review" | "session" | "escalation" | "pool";
  label: string;
}

export const MOCK_MENTOR_ACTIVITY: Record<string, MockMentorActivityItem[]> = {};

export interface PoolReassignEvent {
  id: string;
  poolId?: string;
  at: string;
  fromMentorId: string | null;
  toMentorId: string;
  by: string;
  note?: string;
}

export const MOCK_POOL_REASSIGN_HISTORY: Record<string, PoolReassignEvent[]> = {};
