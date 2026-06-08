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

export const MOCK_ADMIN_MENTORS: MockAdminMentor[] = [
  { id: "m-priya",   name: "Priya Iyer",       email: "priya@glimmora.team",   country: "India",  roles: ["mentor.lead"],   pools: ["p-helios"],                status: "active",  activeSince: "2025-01-15T00:00:00Z", reviews30d: 18, sessions30d: 12, escalations30d: 0, avgReviewMin: 22, slaHitPct: 94 },
  { id: "m-rajesh",  name: "Rajesh Verma",     email: "rajesh@glimmora.team",  country: "India",  roles: ["mentor.senior"], pools: ["p-helios", "p-reporting"],  status: "active",  activeSince: "2025-03-04T00:00:00Z", reviews30d: 24, sessions30d: 8,  escalations30d: 1, avgReviewMin: 28, slaHitPct: 88 },
  { id: "m-amelia",  name: "Amelia Stone",     email: "amelia@glimmora.team",  country: "USA",    roles: ["mentor.senior"], pools: ["p-cross"],                  status: "active",  activeSince: "2025-04-22T00:00:00Z", reviews30d: 30, sessions30d: 6,  escalations30d: 0, avgReviewMin: 19, slaHitPct: 97 },
  { id: "m-anjali",  name: "Anjali Roy",       email: "anjali@glimmora.team",  country: "India",  roles: ["mentor.lead"],   pools: ["p-reporting"],              status: "active",  activeSince: "2025-02-12T00:00:00Z", reviews30d: 22, sessions30d: 10, escalations30d: 0, avgReviewMin: 24, slaHitPct: 92 },
  { id: "m-fatima",  name: "Fatima Nair",      email: "fatima@glimmora.team",  country: "India",  roles: ["mentor"],        pools: ["p-helios"],                 status: "active",  activeSince: "2025-08-04T00:00:00Z", reviews30d: 14, sessions30d: 3,  escalations30d: 0, avgReviewMin: 31, slaHitPct: 86 },
  { id: "m-marco",   name: "Marco Bianchi",    email: "marco@glimmora.team",   country: "Italy",  roles: ["mentor"],        pools: ["p-cross", "p-northwind"], status: "suspended", activeSince: "2025-09-01T00:00:00Z", reviews30d: 0,  sessions30d: 0,  escalations30d: 0, avgReviewMin: 35, slaHitPct: 82 },
  { id: "m-jose",    name: "José Ortega",      email: "jose@glimmora.team",    country: "Spain",  roles: ["mentor.senior"], pools: ["p-cross"],                  status: "active",  activeSince: "2025-05-14T00:00:00Z", reviews30d: 19, sessions30d: 5,  escalations30d: 0, avgReviewMin: 21, slaHitPct: 95 },
  { id: "m-divya",   name: "Divya Krishnan",   email: "divya@glimmora.team",   country: "India",  roles: ["mentor"],        pools: [],                            status: "pending", activeSince: "2026-05-24T00:00:00Z", reviews30d: 0,  sessions30d: 0,  escalations30d: 0, avgReviewMin: 0,  slaHitPct: 0 },
  { id: "m-arvind",  name: "Arvind Mehta",     email: "arvind@glimmora.team",  country: "India",  roles: ["mentor"],        pools: ["p-helios"],                 status: "paused",  activeSince: "2024-11-20T00:00:00Z", reviews30d: 0,  sessions30d: 0,  escalations30d: 0, avgReviewMin: 25, slaHitPct: 90 },
];

export const MOCK_MENTOR_POOLS: MockMentorPool[] = [
  { id: "p-helios",    name: "Helios review pool",     scope: "tenant",       tenantId: "t-acme",   tenantName: "Acme Corp",    mentors: 4, leadMentorId: "m-priya",  loadPct: 60 },
  { id: "p-reporting", name: "Reporting V2 pool",      scope: "tenant",       tenantId: "t-acme",   tenantName: "Acme Corp",    mentors: 2, leadMentorId: "m-anjali", loadPct: 42 },
  { id: "p-northwind", name: "Northwind ops pool",     scope: "tenant",       tenantId: "t-northwind", tenantName: "Northwind", mentors: 1, leadMentorId: "m-marco", loadPct: 15 },
  { id: "p-cross",     name: "Cross-pool (global)",    scope: "cross-tenant",                                                       mentors: 3, leadMentorId: "m-amelia", loadPct: 30 },
];

// Competency matrix per mentor (subset — seeded for the first few)
export const MOCK_MENTOR_COMPETENCY: Record<string, MockCompetencyRow[]> = {
  "m-priya": [
    { role: "engineer", skillId: "s-react",    skillName: "React",           levels: { L1: true, L2: true,  L3: true,  L4: true  } },
    { role: "engineer", skillId: "s-ts",       skillName: "TypeScript",      levels: { L1: true, L2: true,  L3: true,  L4: false } },
    { role: "engineer", skillId: "s-nextjs",   skillName: "Next.js",         levels: { L1: true, L2: true,  L3: true,  L4: true  } },
    { role: "designer", skillId: "s-figma",    skillName: "Figma",           levels: { L1: true, L2: true,  L3: false, L4: false } },
    { role: "designer", skillId: "s-a11y",     skillName: "Accessibility (WCAG)", levels: { L1: false, L2: true, L3: true, L4: true } },
  ],
  "m-rajesh": [
    { role: "engineer", skillId: "s-python",   skillName: "Python",          levels: { L1: true, L2: true,  L3: true,  L4: true  } },
    { role: "engineer", skillId: "s-fastapi",  skillName: "FastAPI",         levels: { L1: true, L2: true,  L3: true,  L4: false } },
    { role: "engineer", skillId: "s-postgres", skillName: "PostgreSQL",      levels: { L1: true, L2: true,  L3: true,  L4: true  } },
  ],
  "m-anjali": [
    { role: "data", skillId: "s-sql", skillName: "SQL", levels: { L1: true, L2: true, L3: true, L4: false } },
    { role: "data", skillId: "s-tableau", skillName: "Tableau", levels: { L1: true, L2: true, L3: false, L4: false } },
  ],
};

export interface MockMentorActivityItem {
  at: string;
  kind: "review" | "session" | "escalation" | "pool";
  label: string;
}

export const MOCK_MENTOR_ACTIVITY: Record<string, MockMentorActivityItem[]> = {
  "m-priya": [
    { at: "2026-05-27T12:08:00Z", kind: "review", label: "Accepted RV-8804 · UI walkthroughs" },
    { at: "2026-05-26T16:20:00Z", kind: "session", label: "Mentorship session · Helios onboarding" },
    { at: "2026-05-25T09:10:00Z", kind: "review", label: "Accepted RV-8799 · API contract tests" },
  ],
  "m-rajesh": [
    { at: "2026-05-27T08:00:00Z", kind: "review", label: "Rework requested · RV-8788" },
    { at: "2026-05-24T14:30:00Z", kind: "escalation", label: "Escalated SLA breach · Reporting V2" },
  ],
  "m-divya": [],
};

export interface PoolReassignEvent {
  id: string;
  poolId?: string;
  at: string;
  fromMentorId: string | null;
  toMentorId: string;
  by: string;
  note?: string;
}

export const MOCK_POOL_REASSIGN_HISTORY: Record<string, PoolReassignEvent[]> = {
  "p-helios": [
    { id: "pr-1", poolId: "p-helios", at: "2026-03-01T10:00:00Z", fromMentorId: null, toMentorId: "m-priya", by: "Anjali Rao", note: "Initial lead designation" },
  ],
  "p-reporting": [
    { id: "pr-2", poolId: "p-reporting", at: "2026-02-12T11:00:00Z", fromMentorId: null, toMentorId: "m-anjali", by: "Anjali Rao" },
  ],
};
