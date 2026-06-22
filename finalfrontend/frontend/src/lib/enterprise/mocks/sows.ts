/**
 * SOW mock data + accessors.
 *
 * Backend handoff: replace the `list*` / `get*` / `record*` function
 * bodies with fetch calls. Hook signatures upstream stay unchanged.
 *
 * Real API contract (for backend devs):
 *   GET    /api/sow?status=&stage=&ownerId=&includeArchived=&limit=&cursor=
 *           → { items: SowSummary[]; nextCursor: string | null }
 *   GET    /api/sow/:id  → { sow: SowDetail }
 *   POST   /api/sow                              body: CreateSowInput
 *   PATCH  /api/sow/:id                          body: UpdateSowDraftInput
 *   POST   /api/sow/:id/submit                   → { sow }
 *   POST   /api/sow/:id/withdraw    { reason }   → { sow }
 *   POST   /api/sow/:id/archive                  → { sow }
 *   POST   /api/sow/:id/approve     { stage, comment }  → TransitionEnvelope
 *   POST   /api/sow/:id/reject      { stage, comment }  → TransitionEnvelope
 *   POST   /api/sow/:id/send-back   { fromStage, toStage, comment } → TransitionEnvelope
 */

import type {
  CreateSowInput,
  SowApprovalSummary,
  SowDetail,
  SowStage,
  SowStatus,
  SowSummary,
  UpdateSowDraftInput,
} from "@/lib/sow/types";
import { APPROVAL_STAGE_ORDER } from "@/lib/sow/types";
import {
  PLATFORM_APPROVAL_STAGE,
  STAGE_SLA_HOURS,
  isEnterpriseStage,
} from "@/lib/sow/approval-pipeline";
import {
  buildSowPricingAi,
  buildSowPricingManual,
  readSowPricing,
  writeSowPricing,
  type SowPricing,
} from "@/lib/pricing";
import { applyOverlay, createOverlayStore } from "./overlay";
import { isSowOwner } from "@/lib/enterprise/rbac";

const OWNER = "sandeep@acme.com";
const OWNER_NAME = "Sandeep Kulkarni";
const DEFAULT_TENANT = { id: "t-acme", name: "Acme Corp" };

function isoFromNowHours(hours: number): string {
  const d = new Date();
  d.setUTCHours(d.getUTCHours() + hours);
  return d.toISOString();
}

function isoDaysAgo(days: number, hours = 9): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(hours, 0, 0, 0);
  return d.toISOString();
}

/* ────────────────────────── seed SOWs ─────────────────────────── */

interface MockSow extends SowDetail {
  /** Friendly project the SOW belongs to (only used in mock UI). */
  project?: string;
}

const SEED: MockSow[] = [
  mkSow({
    id: "sow-acme-1",
    title: "API redesign — Acme platform v3",
    status: "approved",
    stage: "platform",
    daysOld: 28,
    submittedDaysAgo: 24,
    approvedDaysAgo: 16,
    approvals: stages(["approved", "approved", "approved", "approved"], 22, OWNER),
    // Manual mode demo — enterprise proposed value + Glimmora fee.
    pricing: buildSowPricingManual(
      { enterpriseProposed: 1_000_000, platformFeeAmount: 200_000 },
      720_000,
    ),
  }),
  mkSow({
    id: "sow-acme-2",
    title: "Customer onboarding redesign",
    status: "approval",
    stage: "finance",
    daysOld: 18,
    submittedDaysAgo: 12,
    approvals: stages(["pending", "pending", "pending", "pending"], 11, OWNER),
    // AI mode demo — base + SOW processing cost + uplift.
    pricing: buildSowPricingAi(
      { aiBasePrice: 800_000, sowProcessingCost: 100_000, uplift: 200_000 },
      540_000,
    ),
  }),
  mkSow({
    id: "sow-acme-3",
    title: "Helios mobile companion app",
    status: "approval",
    stage: "finance",
    daysOld: 7,
    submittedDaysAgo: 3,
    approvals: stages(["pending", "pending", "pending", "pending"], 3, OWNER),
  }),
  mkSow({
    id: "sow-acme-4",
    title: "Q4 marketing site refresh",
    status: "draft",
    stage: null,
    daysOld: 2,
  }),
  mkSow({
    id: "sow-acme-5",
    title: "Internal HR portal v2",
    status: "approved",
    stage: "platform",
    daysOld: 45,
    submittedDaysAgo: 40,
    approvedDaysAgo: 34,
    approvals: stages(["approved", "approved", "approved", "approved"], 39, OWNER),
  }),
  mkSow({
    id: "sow-acme-6",
    title: "Vendor reconciliation automation",
    status: "rejected",
    stage: "security",
    daysOld: 21,
    submittedDaysAgo: 19,
    rejectedDaysAgo: 9,
    approvals: stages(["approved", "rejected", "pending", "pending"], 19, OWNER),
  }),
  mkSow({
    id: "sow-acme-7",
    title: "Pricing API v2 + ledger sync",
    status: "approval",
    stage: "security",
    daysOld: 14,
    submittedDaysAgo: 11,
    approvals: stages(["approved", "pending", "pending", "pending"], 11, OWNER),
  }),
  mkSow({
    id: "sow-acme-8",
    title: "Analytics warehouse migration",
    status: "approval",
    stage: "legal",
    daysOld: 30,
    submittedDaysAgo: 25,
    approvals: stages(["approved", "approved", "pending", "pending"], 25, OWNER),
  }),
  mkSow({
    id: "sow-acme-9",
    title: "Acme retail POS hardening",
    status: "approval",
    stage: "platform",
    daysOld: 8,
    submittedDaysAgo: 6,
    approvals: stages(["approved", "approved", "approved", "pending"], 6, OWNER),
  }),
  mkSow({
    id: "sow-lighthouse-reporting",
    title: "Lighthouse-Ops reporting platform",
    status: "approval",
    stage: "legal",
    tenantId: "t-reporting",
    tenantName: "Reporting Inc.",
    ownerId: "helios@reporting.tv",
    ownerName: "Priya Sharma",
    daysOld: 5,
    submittedDaysAgo: 2,
    approvals: stages(["approved", "approved", "pending", "pending"], 2, "helios@reporting.tv"),
  }),
  mkSow({
    id: "sow-helios-14",
    title: "Helios Q3 modernization — phase 2",
    status: "approval",
    stage: "platform",
    tenantId: "t-helios",
    tenantName: "Helios Studios",
    ownerId: "admin@helios.io",
    ownerName: "Meera Bhat",
    daysOld: 11,
    submittedDaysAgo: 4,
    approvals: stages(["approved", "approved", "approved", "pending"], 4, "admin@helios.io"),
  }),
  mkSow({
    id: "sow-acme-10",
    title: "Self-serve user provisioning",
    status: "approved",
    stage: "platform",
    daysOld: 60,
    submittedDaysAgo: 55,
    approvedDaysAgo: 50,
    approvals: stages(["approved", "approved", "approved", "approved"], 54, OWNER),
  }),
  mkSow({
    id: "sow-acme-11",
    title: "Compliance reporting dashboard",
    status: "withdrawn",
    stage: "finance",
    daysOld: 32,
    submittedDaysAgo: 28,
    withdrawnDaysAgo: 18,
    approvals: stages(["pending", "pending", "pending", "pending"], 28, OWNER),
  }),
  mkSow({
    id: "sow-acme-12",
    title: "Search relevance overhaul",
    status: "approval",
    stage: "finance",
    daysOld: 9,
    submittedDaysAgo: 6,
    approvals: stages(["pending", "pending", "pending", "pending"], 6, OWNER),
  }),
  mkSow({
    id: "sow-acme-13",
    title: "Data platform observability rollout",
    status: "approved",
    stage: "platform",
    daysOld: 12,
    submittedDaysAgo: 8,
    approvedDaysAgo: 2,
    approvals: stages(["approved", "approved", "approved", "approved"], 7, OWNER),
  }),
];

interface MkArgs {
  id: string;
  title: string;
  status: SowStatus;
  stage: SowStage | null;
  daysOld: number;
  submittedDaysAgo?: number;
  approvedDaysAgo?: number;
  rejectedDaysAgo?: number;
  withdrawnDaysAgo?: number;
  approvals?: SowApprovalSummary[];
  tenantId?: string;
  tenantName?: string;
  ownerId?: string;
  ownerName?: string;
  /**
   * Typed three-price pricing for the platform admin view. When the SOW is
   * `approved`, the builder also stamps `pricing.lockedAt` to reflect the
   * Phase-5 freeze-at-approval rule.
   */
  pricing?: SowPricing;
}

function mkSow(a: MkArgs): MockSow {
  const tenantId = a.tenantId ?? DEFAULT_TENANT.id;
  const tenantName = a.tenantName ?? DEFAULT_TENANT.name;
  const ownerId = a.ownerId ?? OWNER;
  const ownerName = a.ownerName ?? OWNER_NAME;
  // Lock pricing at approval — matches Phase 5 freeze rule.
  const pricing =
    a.pricing && a.status === "approved" && a.pricing.lockedAt == null
      ? { ...a.pricing, lockedAt: isoDaysAgo(a.approvedDaysAgo ?? 0) }
      : a.pricing;
  const basePayload: Record<string, unknown> = {
    summary: `Auto-generated demo payload for ${a.title}`,
    tenantId,
  };
  const payload = pricing ? writeSowPricing(basePayload, pricing) : basePayload;
  return {
    id: a.id,
    title: a.title,
    status: a.status,
    stage: a.stage,
    activeVersion: 1,
    ownerId,
    ownerName,
    tenantId,
    tenantName,
    confidentiality: "internal",
    submittedForApprovalAt: a.submittedDaysAgo != null ? isoDaysAgo(a.submittedDaysAgo) : null,
    approvedAt: a.approvedDaysAgo != null ? isoDaysAgo(a.approvedDaysAgo) : null,
    rejectedAt: a.rejectedDaysAgo != null ? isoDaysAgo(a.rejectedDaysAgo) : null,
    withdrawnAt: a.withdrawnDaysAgo != null ? isoDaysAgo(a.withdrawnDaysAgo) : null,
    archivedAt: null,
    createdAt: isoDaysAgo(a.daysOld),
    updatedAt: isoDaysAgo(a.approvedDaysAgo ?? a.rejectedDaysAgo ?? a.withdrawnDaysAgo ?? a.submittedDaysAgo ?? a.daysOld),
    activeVersionDetail: {
      version: 1,
      payload,
      body: `# ${a.title}\n\nScope details, acceptance criteria, and deliverables for the demo.`,
      changeNote: "initial",
      createdBy: ownerId,
      createdAt: isoDaysAgo(a.daysOld),
    },
    approvals: a.approvals ?? [],
  };
}

function stages(
  decisions: SowApprovalSummary["decision"][],
  submittedDaysAgo: number,
  approverId: string,
): SowApprovalSummary[] {
  return APPROVAL_STAGE_ORDER.map((stage, i) => {
    const decision = decisions[i] ?? "pending";
    const decidedAt =
      decision === "approved" || decision === "rejected" || decision === "send_back"
        ? isoDaysAgo(Math.max(0, submittedDaysAgo - (i + 1) * 2))
        : null;
    const slaHours = STAGE_SLA_HOURS[stage];
    const slaDeadline =
      decision === "pending"
        ? isoFromNowHours(Math.max(2, slaHours - i * 6))
        : decidedAt
          ? isoDaysAgo(Math.max(0, submittedDaysAgo - 3))
          : null;
    return {
      id: `appr-${stage}-${i}`,
      stage,
      sowVersion: 1,
      approverId: decision === "pending" ? null : approverId,
      decision,
      comment:
        decision === "approved"
          ? "Looks good"
          : decision === "rejected"
            ? "Needs security review"
            : decision === "send_back"
              ? "Returned for revision"
              : null,
      decidedAt,
      slaDeadline,
      createdAt: isoDaysAgo(submittedDaysAgo),
    };
  });
}

/* ────────────────────────── store + accessors ─────────────────────── */

type SowOverlayShape = SowDetail & { __deletedAt?: string };
const overlay = createOverlayStore<SowOverlayShape>("glimmora.mock.sows.v2");

function allMerged(): SowDetail[] {
  return applyOverlay<SowDetail>(SEED, overlay.read() as Record<string, SowOverlayShape>);
}

function toSummary(d: SowDetail): SowSummary {
  const { activeVersionDetail: _a, approvals: _b, ...rest } = d;
  return rest;
}

export function listSowsMock(params: {
  status?: SowStatus | SowStatus[];
  includeArchived?: boolean;
  limit?: number;
} = {}): { items: SowSummary[]; nextCursor: string | null } {
  let items = allMerged().map(toSummary);
  if (params.status) {
    const allowed = Array.isArray(params.status) ? new Set(params.status) : new Set([params.status]);
    items = items.filter((s) => allowed.has(s.status));
  }
  if (!params.includeArchived) items = items.filter((s) => s.status !== "archived");
  items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  if (params.limit) items = items.slice(0, params.limit);
  return { items, nextCursor: null };
}

export function getSowMock(id: string): SowDetail | undefined {
  return allMerged().find((s) => s.id === id);
}

export function createSowMock(input: CreateSowInput): SowDetail {
  const id = `sow-acme-${Date.now().toString(36)}`;
  const now = new Date().toISOString();
  const full: SowDetail = {
    id,
    title: input.title,
    status: "draft",
    stage: null,
    activeVersion: 1,
    ownerId: OWNER,
    ownerName: OWNER_NAME,
    tenantId: DEFAULT_TENANT.id,
    tenantName: DEFAULT_TENANT.name,
    confidentiality: input.confidentiality ?? "internal",
    submittedForApprovalAt: null,
    approvedAt: null,
    rejectedAt: null,
    withdrawnAt: null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
    activeVersionDetail: {
      version: 1,
      payload: input.payload,
      body: input.body ?? null,
      changeNote: "initial",
      createdBy: OWNER,
      createdAt: now,
    },
    approvals: [],
  };
  overlay.insert(id, full);
  return full;
}

export function updateSowDraftMock(id: string, input: UpdateSowDraftInput): SowDetail {
  const current = getSowMock(id);
  if (!current) throw new Error(`SOW ${id} not found`);
  const merged: SowDetail = {
    ...current,
    title: input.title ?? current.title,
    confidentiality: input.confidentiality ?? current.confidentiality,
    updatedAt: new Date().toISOString(),
    activeVersionDetail: current.activeVersionDetail
      ? {
          ...current.activeVersionDetail,
          payload: input.payload ?? current.activeVersionDetail.payload,
          body: input.body ?? current.activeVersionDetail.body,
          changeNote: input.changeNote ?? current.activeVersionDetail.changeNote,
        }
      : null,
  };
  overlay.patch(id, merged);
  return merged;
}

function transition(id: string, patch: Partial<SowDetail>): SowDetail {
  const current = getSowMock(id);
  if (!current) throw new Error(`SOW ${id} not found`);
  const merged: SowDetail = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  overlay.patch(id, merged);
  return merged;
}

export function submitSowMock(id: string): SowDetail {
  const current = getSowMock(id);
  if (!current) throw new Error(`SOW ${id} not found`);

  const payload = current.activeVersionDetail?.payload ?? {};
  const submission = payload.submission as
    | { approvers?: Partial<Record<SowStage, { id: string }>> }
    | undefined;
  const assigned = submission?.approvers ?? {};
  const submittedAt = new Date();

  const approvals: SowApprovalSummary[] = APPROVAL_STAGE_ORDER.map((stage, i) => {
    const slaHours = STAGE_SLA_HOURS[stage];
    const slaDeadline = new Date(
      submittedAt.getTime() + slaHours * 60 * 60 * 1000,
    ).toISOString();
    return {
      id: `appr-${stage}-${i}-${submittedAt.getTime()}`,
      stage,
      sowVersion: current.activeVersion,
      approverId: assigned[stage]?.id ?? null,
      decision: "pending",
      comment: null,
      decidedAt: null,
      slaDeadline,
      createdAt: submittedAt.toISOString(),
    };
  });

  return transition(id, {
    status: "approval",
    stage: APPROVAL_STAGE_ORDER[0]!,
    submittedForApprovalAt: submittedAt.toISOString(),
    approvals,
  });
}

export function withdrawSowMock(id: string, _reason?: string): SowDetail {
  return transition(id, { status: "withdrawn", withdrawnAt: new Date().toISOString() });
}

export function archiveSowMock(id: string): SowDetail {
  return transition(id, { status: "archived", archivedAt: new Date().toISOString() });
}

export function approveSowMock(
  id: string,
  stage: SowStage,
  comment?: string,
  approverId = OWNER,
) {
  const current = getSowMock(id);
  if (!current) throw new Error(`SOW ${id} not found`);
  // Four-eyes on enterprise internal gates: the SOW owner cannot approve
  // their own SOW. The platform gate is Glimmora-owned (no owner conflict).
  if (isEnterpriseStage(stage) && isSowOwner(approverId, current.ownerId)) {
    throw new Error(
      "The SOW owner cannot approve their own SOW's internal gates. Ask the relevant enterprise reviewer to approve.",
    );
  }
  const effectiveApprover = stage === "platform" ? "glimmora-platform" : approverId;
  const approvals: SowApprovalSummary[] = current.approvals.map((a) =>
    a.stage === stage
      ? {
          ...a,
          decision: "approved",
          approverId: effectiveApprover,
          comment: comment ?? "Approved",
          decidedAt: new Date().toISOString(),
        }
      : a,
  );
  const idx = APPROVAL_STAGE_ORDER.indexOf(stage);
  const nextStage: SowStage | null =
    idx >= 0 && idx + 1 < APPROVAL_STAGE_ORDER.length ? APPROVAL_STAGE_ORDER[idx + 1]! : null;
  const isTerminal = stage === PLATFORM_APPROVAL_STAGE; // platform is the last gate

  // Phase 5: lock pricing at SOW approval. Once frozen, marginAmount /
  // clientPrice / inputs cannot drift even if upstream cost basis changes.
  let activeVersionDetail = current.activeVersionDetail;
  if (isTerminal && activeVersionDetail) {
    const pricing = readSowPricing(activeVersionDetail.payload);
    if (pricing && pricing.lockedAt == null) {
      activeVersionDetail = {
        ...activeVersionDetail,
        payload: writeSowPricing(activeVersionDetail.payload, {
          ...pricing,
          lockedAt: new Date().toISOString(),
        }),
      };
    }
  }

  const merged = transition(id, {
    approvals,
    stage: isTerminal ? PLATFORM_APPROVAL_STAGE : nextStage,
    status: isTerminal ? "approved" : "approval",
    approvedAt: isTerminal ? new Date().toISOString() : current.approvedAt,
    activeVersionDetail,
  });
  return {
    sow: merged,
    transition: {
      fromStage: stage,
      advancedTo: isTerminal ? null : nextStage,
      terminal: isTerminal,
    },
  };
}

/**
 * Glimmora platform gate — the final approval gate, after all enterprise
 * internal gates (finance → security → legal) have passed.
 * SOW must be at `stage === "platform"`.
 *
 * Backend handoff: POST /api/admin/sow/:id/approve-platform { comment }
 * (or reuse POST /api/sow/:id/approve { stage: "platform", comment } with ops RBAC)
 */
export function acceptSowMock(id: string, comment?: string): SowDetail {
  const current = getSowMock(id);
  if (!current) throw new Error(`SOW ${id} not found`);
  if (current.status !== "approval" || current.stage !== PLATFORM_APPROVAL_STAGE) {
    throw new Error(
      "Glimmora platform gate only applies after enterprise internal gates pass (stage = platform)",
    );
  }
  return approveSowMock(
    id,
    PLATFORM_APPROVAL_STAGE,
    comment ?? "Approved by Glimmora platform",
    "glimmora-platform",
  ).sow;
}

/** Rejects the SOW at the Glimmora platform gate. */
export function declineSowMock(id: string, comment: string): SowDetail {
  const current = getSowMock(id);
  if (!current) throw new Error(`SOW ${id} not found`);
  if (current.stage !== PLATFORM_APPROVAL_STAGE) {
    throw new Error("Platform decline only applies at the Glimmora platform stage");
  }
  return rejectSowMock(id, PLATFORM_APPROVAL_STAGE, comment, "glimmora-platform").sow;
}

export function rejectSowMock(
  id: string,
  stage: SowStage,
  comment: string,
  approverId: string = OWNER,
) {
  const current = getSowMock(id);
  if (!current) throw new Error(`SOW ${id} not found`);
  // Attribute the rejection to the actual reviewer (or the platform gate),
  // never blindly to the SOW owner.
  const effectiveApprover =
    stage === "platform"
      ? "glimmora-platform"
      : current.approvals.find((a) => a.stage === stage)?.approverId ?? approverId;
  const approvals: SowApprovalSummary[] = current.approvals.map((a) =>
    a.stage === stage
      ? { ...a, decision: "rejected", approverId: effectiveApprover, comment, decidedAt: new Date().toISOString() }
      : a,
  );
  const merged = transition(id, {
    approvals,
    status: "rejected",
    rejectedAt: new Date().toISOString(),
  });
  return {
    sow: merged,
    transition: { fromStage: stage, advancedTo: null, terminal: true },
  };
}

export function sendBackSowMock(id: string, fromStage: SowStage, toStage: SowStage, comment: string) {
  const current = getSowMock(id);
  if (!current) throw new Error(`SOW ${id} not found`);
  const approvals: SowApprovalSummary[] = current.approvals.map((a) =>
    a.stage === fromStage
      ? { ...a, decision: "send_back", comment, decidedAt: new Date().toISOString() }
      : a,
  );
  // A send-back returns the SOW to the owner for correction + resubmission.
  // It must go back to DRAFT — otherwise it sits in `approval` where editing is
  // blocked (a dead-end). The owner edits and resubmits, restarting approval.
  const merged = transition(id, {
    approvals,
    status: "draft",
    stage: null,
    submittedForApprovalAt: null,
  });
  return {
    sow: merged,
    transition: { fromStage, advancedTo: toStage, terminal: false },
  };
}

/** Platform gate returns SOW to enterprise draft for revision. */
export function returnSowToDraftMock(id: string, comment: string) {
  const current = getSowMock(id);
  if (!current) throw new Error(`SOW ${id} not found`);
  const fromStage = current.stage ?? PLATFORM_APPROVAL_STAGE;
  const approvals: SowApprovalSummary[] = current.approvals.map((a) =>
    a.stage === fromStage
      ? { ...a, decision: "send_back", comment, decidedAt: new Date().toISOString() }
      : a,
  );
  const merged = transition(id, {
    approvals,
    status: "draft",
    stage: null,
    submittedForApprovalAt: null,
  });
  return {
    sow: merged,
    transition: { fromStage, advancedTo: null, terminal: false },
  };
}

export { overlay as sowOverlay };
