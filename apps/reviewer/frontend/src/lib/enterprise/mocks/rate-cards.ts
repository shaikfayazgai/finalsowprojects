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

const STD: RateRow[] = [];

const HELIOS_ROWS: RateRow[] = [];

const REPORTING_DRAFT: RateRow[] = [];

const SEED: RateCardDetail[] = [];

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
    tenantId: "",
    tenantCurrency: "INR",
    rateCards: {
      currency: std.currency,
      default: 120_000,
      bySegment: std.bySegment,
    },
  };
}

export { overlay as rateCardOverlay };
