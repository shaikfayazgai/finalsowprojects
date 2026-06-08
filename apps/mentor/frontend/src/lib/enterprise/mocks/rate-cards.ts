/**
 * Rate cards mock — multi-card list per §5.G.4 wireframe (Active /
 * Draft / Expired). Real backend in Phase 1 only stored a single tenant
 * card; the mock exposes the multi-card view the spec mandates.
 *
 * Backend handoff:
 *   GET /api/enterprise/rate-cards        → { items: RateCardSummary[] }
 *   GET /api/enterprise/rate-cards/:id    → RateCardDetail
 *   POST /api/enterprise/rate-cards       body: CreateRateCardInput
 */

import { applyOverlay, createOverlayStore } from "./overlay";

export type RateCardStatus = "active" | "draft" | "expired";
export type RateCardScope = "tenant" | "project" | "sow";

export interface RateRow {
  role: string;
  skill: string;
  level: string;
  region: string;
  rateMinorPerHour: number;
}

export interface RateCardSummary {
  id: string;
  name: string;
  scope: RateCardScope;
  scopeLabel: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  rowCount: number;
  status: RateCardStatus;
  currency: string;
}

export interface RateCardDetail extends RateCardSummary {
  rows: RateRow[];
  bySegment?: {
    student?: number;
    women_workforce?: number;
    general_workforce?: number;
    internal?: number;
  };
}

function iso(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

const STD: RateRow[] = [
  { role: "Designer", skill: "Figma",      level: "L1", region: "India", rateMinorPerHour:  80_000 },
  { role: "Designer", skill: "Figma",      level: "L2", region: "India", rateMinorPerHour: 120_000 },
  { role: "Designer", skill: "Figma",      level: "L3", region: "India", rateMinorPerHour: 180_000 },
  { role: "Backend",  skill: "Python",     level: "L2", region: "India", rateMinorPerHour: 150_000 },
  { role: "Backend",  skill: "Python",     level: "L3", region: "India", rateMinorPerHour: 220_000 },
  { role: "Backend",  skill: "SQL",        level: "L3", region: "India", rateMinorPerHour: 200_000 },
  { role: "Frontend", skill: "TypeScript", level: "L2", region: "India", rateMinorPerHour: 140_000 },
  { role: "Frontend", skill: "TypeScript", level: "L3", region: "India", rateMinorPerHour: 210_000 },
  { role: "Data",     skill: "Python",     level: "L2", region: "India", rateMinorPerHour: 150_000 },
  { role: "SRE",      skill: "AWS",        level: "L3", region: "India", rateMinorPerHour: 240_000 },
  { role: "QA",       skill: "Playwright", level: "L2", region: "India", rateMinorPerHour: 110_000 },
  { role: "PM",       skill: "Discovery",  level: "L3", region: "India", rateMinorPerHour: 250_000 },
];

const HELIOS_ROWS: RateRow[] = [
  ...STD,
  { role: "Designer", skill: "Motion",     level: "L3", region: "India", rateMinorPerHour: 200_000 },
  { role: "Backend",  skill: "Go",         level: "L3", region: "India", rateMinorPerHour: 230_000 },
];

const REPORTING_DRAFT: RateRow[] = [
  { role: "Data",     skill: "dbt",        level: "L3", region: "India", rateMinorPerHour: 220_000 },
  { role: "Data",     skill: "Looker",     level: "L2", region: "India", rateMinorPerHour: 160_000 },
  { role: "Backend",  skill: "Python",     level: "L3", region: "India", rateMinorPerHour: 220_000 },
];

const SEED: RateCardDetail[] = [
  {
    id: "rc-std-2026",
    name: "Standard 2026",
    scope: "tenant",
    scopeLabel: "Tenant-wide",
    effectiveFrom: "2026-01-01T00:00:00Z",
    effectiveTo: null,
    rowCount: STD.length,
    status: "active",
    currency: "INR",
    rows: STD,
    bySegment: {
      general_workforce: 120_000,
      women_workforce: 132_000,
      student: 80_000,
      internal: 240_000,
    },
  },
  {
    id: "rc-helios-q3",
    name: "Helios Q3 special",
    scope: "project",
    scopeLabel: "Project · Helios Q3",
    effectiveFrom: "2026-06-01T00:00:00Z",
    effectiveTo: "2026-09-30T00:00:00Z",
    rowCount: HELIOS_ROWS.length,
    status: "active",
    currency: "INR",
    rows: HELIOS_ROWS,
  },
  {
    id: "rc-reporting-draft",
    name: "Reporting V2 spec",
    scope: "project",
    scopeLabel: "Project · Reporting V2",
    effectiveFrom: "2026-07-15T00:00:00Z",
    effectiveTo: "2026-08-31T00:00:00Z",
    rowCount: REPORTING_DRAFT.length,
    status: "draft",
    currency: "INR",
    rows: REPORTING_DRAFT,
  },
  {
    id: "rc-std-2025",
    name: "Standard 2025",
    scope: "tenant",
    scopeLabel: "Tenant-wide",
    effectiveFrom: "2025-01-01T00:00:00Z",
    effectiveTo: "2025-12-31T00:00:00Z",
    rowCount: 76,
    status: "expired",
    currency: "INR",
    rows: STD,
  },
  {
    id: "rc-onboarding",
    name: "Onboarding redesign",
    scope: "sow",
    scopeLabel: "SOW · sow-acme-2",
    effectiveFrom: iso(7),
    effectiveTo: null,
    rowCount: 8,
    status: "draft",
    currency: "INR",
    rows: STD.slice(0, 8),
  },
  {
    id: "rc-hr-portal",
    name: "HR portal v2",
    scope: "project",
    scopeLabel: "Project · HR Portal",
    effectiveFrom: iso(60),
    effectiveTo: null,
    rowCount: 10,
    status: "active",
    currency: "INR",
    rows: STD.slice(0, 10),
  },
];

const overlay = createOverlayStore<RateCardDetail>("glimmora.mock.rateCards.v1");

function merged(): RateCardDetail[] {
  return applyOverlay<RateCardDetail>(SEED, overlay.read());
}

export function listRateCardsMock(): RateCardSummary[] {
  return merged().map((c) => {
    const { rows: _r, bySegment: _b, ...rest } = c;
    return rest;
  });
}

export function getRateCardMock(id: string): RateCardDetail | undefined {
  return merged().find((c) => c.id === id);
}

export interface CreateRateCardInput {
  name: string;
  scope: RateCardScope;
  scopeLabel: string;
  effectiveFrom: string;
  effectiveTo?: string;
  rows: RateRow[];
  currency?: string;
}

export function createRateCardMock(input: CreateRateCardInput): RateCardDetail {
  const id = `rc-${Date.now().toString(36)}`;
  const card: RateCardDetail = {
    id,
    name: input.name,
    scope: input.scope,
    scopeLabel: input.scopeLabel,
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo ?? null,
    rowCount: input.rows.length,
    status: "active",
    currency: input.currency ?? "INR",
    rows: input.rows,
  };
  overlay.insert(id, card);
  return card;
}

export interface UpdateRateCardInput {
  name?: string;
  scope?: RateCardScope;
  scopeLabel?: string;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  rows?: RateRow[];
  currency?: string;
  status?: RateCardStatus;
}

export function updateRateCardMock(
  id: string,
  input: UpdateRateCardInput,
): RateCardDetail | undefined {
  const existing = getRateCardMock(id);
  if (!existing) return undefined;

  const patch: Partial<RateCardDetail> = { ...input };
  if (input.rows) {
    patch.rows = input.rows;
    patch.rowCount = input.rows.length;
  }

  overlay.patch(id, patch);
  return getRateCardMock(id);
}

/** Legacy single-tenant-card shape used by /enterprise/billing overview. */
export function getTenantDefaultRateCardMock() {
  const std = SEED[0]!;
  return {
    tenantId: "tnt-acme-corp",
    tenantCurrency: "INR",
    rateCards: {
      currency: std.currency,
      default: 120_000,
      bySegment: std.bySegment,
    },
  };
}

export { overlay as rateCardOverlay };
