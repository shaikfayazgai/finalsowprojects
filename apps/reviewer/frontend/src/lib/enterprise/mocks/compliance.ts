/**
 * Compliance + Consent + Retention mock data.
 *
 * Backend handoff:
 *   GET /api/enterprise/compliance/overview  → ComplianceOverview
 *   GET /api/enterprise/compliance/consent?search=&missing=&limit=&format=
 *                                            → ConsentInventoryResponse | CSV blob
 *   GET /api/enterprise/compliance/retention → RetentionResponse
 *   PUT /api/enterprise/compliance/retention body RetentionRuleSet → RetentionResponse
 */

import type { RetentionRuleSet } from "@/lib/retention";
import { RETENTION_ENTITIES, RETENTION_FLOORS, effectiveRule } from "@/lib/retention";
import { applyOverlay, createOverlayStore } from "./overlay";

/* ───────────────────────── Compliance overview ────────────────────── */

export function complianceOverviewMock() {
  const total = 0;
  const withConsent = 0;
  return {
    tenantId: "",
    consent: {
      totalContributors: total,
      withConsent,
      missingConsent: total - withConsent,
    },
    retention: {
      auditEvents: "7 years",
      taskEvidence: "3 years",
      withdrawnSubmissions: "90 days",
    },
    deletionRequests: {
      pending: 0,
      completedLast30Days: 0,
    },
  };
}

/* ───────────────────────── Consent inventory ──────────────────────── */

export interface MockConsentRow {
  contributorId: string;
  email: string;
  name: string;
  ndaAccepted: boolean;
  acceptTos: boolean;
  acceptCoc: boolean;
  acceptPrivacy: boolean;
  acceptFee: boolean;
  acceptAhp: boolean;
  marketingOptIn: boolean;
  profileUpdatedAt: string | null;
  missingRequired: string[];
  isComplete: boolean;
}

function iso(d: number): string {
  const dt = new Date();
  dt.setUTCDate(dt.getUTCDate() - d);
  return dt.toISOString();
}

const NAMES: Array<{ id: string; email: string; name: string }> = [];

const CONSENT: MockConsentRow[] = NAMES.map((p, i) => {
  const missingTos = i === 11 || i === 13;
  const missingFee = i === 13 || i === 14;
  const missingRequired: string[] = [];
  if (missingTos) missingRequired.push("acceptTos");
  if (missingFee) missingRequired.push("acceptFee");
  return {
    contributorId: p.id,
    email: p.email,
    name: p.name,
    ndaAccepted: i !== 12,
    acceptTos: !missingTos,
    acceptCoc: true,
    acceptPrivacy: true,
    acceptFee: !missingFee,
    acceptAhp: i % 4 !== 0,
    marketingOptIn: i % 3 === 0,
    profileUpdatedAt: iso(i + 1),
    missingRequired,
    isComplete: missingRequired.length === 0,
  };
});

export function consentInventoryMock(q: { search?: string; missing?: boolean; limit?: number } = {}) {
  let rows = [...CONSENT];
  if (q.search) {
    const n = q.search.toLowerCase();
    rows = rows.filter((r) => r.email.toLowerCase().includes(n) || r.name.toLowerCase().includes(n));
  }
  if (q.missing) rows = rows.filter((r) => !r.isComplete);
  const complete = CONSENT.filter((r) => r.isComplete).length;
  if (q.limit) rows = rows.slice(0, q.limit);
  return {
    tenantId: "",
    total: CONSENT.length,
    complete,
    missing: CONSENT.length - complete,
    rows,
  };
}

/* ───────────────────────── Retention rules ────────────────────────── */

const DEFAULT_RULES: RetentionRuleSet = Object.fromEntries(
  RETENTION_ENTITIES.map((entity) => [entity, effectiveRule(entity, null)]),
) as RetentionRuleSet;

const overlay = createOverlayStore<{ id: string; rules: RetentionRuleSet }>("glimmora.mock.retention.v1");

function getRules(): RetentionRuleSet {
  const o = overlay.read()["current"];
  if (!o) return DEFAULT_RULES;
  return (o.rules ?? DEFAULT_RULES) as RetentionRuleSet;
}

export function retentionRulesMock() {
  return {
    tenantId: "",
    rules: getRules(),
    floors: RETENTION_FLOORS,
  };
}

export function updateRetentionRulesMock(rules: RetentionRuleSet) {
  overlay.insert("current", { id: "current", rules });
  return { tenantId: "", rules, floors: RETENTION_FLOORS };
}

export { overlay as complianceOverlay };
applyOverlay; // re-export shim (keeps tree-shaking happy)
