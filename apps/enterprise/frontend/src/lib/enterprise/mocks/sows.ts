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
import { STAGE_SLA_HOURS } from "@/lib/enterprise/mocks/approvers";
import { applyOverlay, createOverlayStore } from "./overlay";

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
    stage: "final",
    daysOld: 28,
    submittedDaysAgo: 24,
    approvedDaysAgo: 16,
    approvals: stages(["approved", "approved", "approved", "approved", "approved"], 22, OWNER),
  }),
  mkSow({
    id: "sow-acme-2",
    title: "Customer onboarding redesign",
    status: "approval",
    stage: "business",
    daysOld: 18,
    submittedDaysAgo: 12,
    approvals: stages(["pending", "pending", "pending", "pending", "pending"], 11, OWNER),
  }),
  mkSow({
    id: "sow-acme-3",
    title: "Helios mobile companion app",
    status: "approval",
    stage: "business",
    daysOld: 7,
    submittedDaysAgo: 3,
    approvals: stages(["pending", "pending", "pending", "pending", "pending"], 3, OWNER),
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
    stage: "final",
    daysOld: 45,
    submittedDaysAgo: 40,
    approvedDaysAgo: 34,
    approvals: stages(["approved", "approved", "approved", "approved", "approved"], 39, OWNER),
  }),
  mkSow({
    id: "sow-acme-6",
    title: "Vendor reconciliation automation",
    status: "rejected",
    stage: "security",
    daysOld: 21,
    submittedDaysAgo: 19,
    rejectedDaysAgo: 9,
    approvals: stages(["approved", "approved", "approved", "rejected", "pending"], 19, OWNER),
  }),
  mkSow({
    id: "sow-acme-7",
    title: "Pricing API v2 + ledger sync",
    status: "approval",
    stage: "business",
    daysOld: 14,
    submittedDaysAgo: 11,
    approvals: stages(["pending", "pending", "pending", "pending", "pending"], 11, OWNER),
  }),
  mkSow({
    id: "sow-acme-8",
    title: "Analytics warehouse migration",
    status: "approval",
    stage: "business",
    daysOld: 30,
    submittedDaysAgo: 25,
    approvals: stages(["pending", "pending", "pending", "pending", "pending"], 25, OWNER),
  }),
  mkSow({
    id: "sow-acme-9",
    title: "Acme retail POS hardening",
    status: "approval",
    stage: "commercial",
    daysOld: 8,
    submittedDaysAgo: 6,
    approvals: stages(["approved", "pending", "pending", "pending", "pending"], 6, OWNER),
  }),
  mkSow({
    id: "sow-lighthouse-reporting",
    title: "Lighthouse-Ops reporting platform",
    status: "approval",
    stage: "commercial",
    tenantId: "t-reporting",
    tenantName: "Reporting Inc.",
    ownerId: "helios@reporting.tv",
    ownerName: "Priya Sharma",
    daysOld: 5,
    submittedDaysAgo: 2,
    approvals: stages(["approved", "pending", "pending", "pending", "pending"], 2, "helios@reporting.tv"),
  }),
  mkSow({
    id: "sow-helios-14",
    title: "Helios Q3 modernization — phase 2",
    status: "approval",
    stage: "commercial",
    tenantId: "t-helios",
    tenantName: "Helios Studios",
    ownerId: "admin@helios.io",
    ownerName: "Meera Bhat",
    daysOld: 11,
    submittedDaysAgo: 4,
    approvals: stages(["approved", "pending", "pending", "pending", "pending"], 4, "admin@helios.io"),
  }),
  mkSow({
    id: "sow-acme-10",
    title: "Self-serve user provisioning",
    status: "approved",
    stage: "final",
    daysOld: 60,
    submittedDaysAgo: 55,
    approvedDaysAgo: 50,
    approvals: stages(["approved", "approved", "approved", "approved", "approved"], 54, OWNER),
  }),
  mkSow({
    id: "sow-acme-11",
    title: "Compliance reporting dashboard",
    status: "withdrawn",
    stage: "business",
    daysOld: 32,
    submittedDaysAgo: 28,
    withdrawnDaysAgo: 18,
    approvals: stages(["pending", "pending", "pending", "pending", "pending"], 28, OWNER),
  }),
  mkSow({
    id: "sow-acme-12",
    title: "Search relevance overhaul",
    status: "approval",
    stage: "business",
    daysOld: 9,
    submittedDaysAgo: 6,
    approvals: stages(["pending", "pending", "pending", "pending", "pending"], 6, OWNER),
  }),
  mkSow({
    id: "sow-acme-13",
    title: "Data platform observability rollout",
    status: "approved",
    stage: "final",
    daysOld: 12,
    submittedDaysAgo: 8,
    approvedDaysAgo: 2,
    approvals: stages(["approved", "approved", "approved", "approved", "approved"], 7, OWNER),
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
}

function mkSow(a: MkArgs): MockSow {
  const tenantId = a.tenantId ?? DEFAULT_TENANT.id;
  const tenantName = a.tenantName ?? DEFAULT_TENANT.name;
  const ownerId = a.ownerId ?? OWNER;
  const ownerName = a.ownerName ?? OWNER_NAME;
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
      payload: { summary: `Auto-generated demo payload for ${a.title}`, tenantId },
      body: `# ${a.title}\n\nScope details, acceptance criteria, and deliverables for the demo.`,
      changeNote: "initial",
      createdBy: ownerId,
      createdAt: isoDaysAgo(a.daysOld),
    },
    approvals: a.approvals ?? [],
  };
}

function stages(decisions: SowApprovalSummary["decision"][], submittedDaysAgo: number, approverId: string): SowApprovalSummary[] {
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
    stage: "business",
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
  const effectiveApprover = stage === "commercial" ? "glimmora-ops" : approverId;
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
  const nextStage: SowStage | null = idx >= 0 && idx + 1 < APPROVAL_STAGE_ORDER.length ? APPROVAL_STAGE_ORDER[idx + 1]! : null;
  // Terminal = approving the LAST stage in the order (now "commercial"), not a
  // hardcoded "final". When the last stage is approved the SOW is fully approved.
  const isTerminal = nextStage === null;
  const merged = transition(id, {
    approvals,
    stage: isTerminal ? stage : nextStage,
    status: isTerminal ? "approved" : "approval",
    approvedAt: isTerminal ? new Date().toISOString() : current.approvedAt,
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
 * Glimmora Commercial gate — approves **stage 2 only** (not the whole SOW).
 * SOW must be at `stage === "commercial"` with Business already signed off.
 *
 * Backend handoff: POST /api/admin/sow/:id/approve-commercial { comment }
 * (or reuse POST /api/sow/:id/approve { stage: "commercial", comment } with ops RBAC)
 */
export function acceptSowMock(id: string, comment?: string): SowDetail {
  const current = getSowMock(id);
  if (!current) throw new Error(`SOW ${id} not found`);
  if (current.status !== "approval" || current.stage !== "commercial") {
    throw new Error("Glimmora Commercial gate only applies when the SOW is at the Commercial stage");
  }
  return approveSowMock(
    id,
    "commercial",
    comment ?? "Approved by Glimmora Commercial",
    "glimmora-ops",
  ).sow;
}

/** Rejects the SOW at the Commercial stage (does not skip other stages). */
export function declineSowMock(id: string, comment: string): SowDetail {
  const current = getSowMock(id);
  if (!current) throw new Error(`SOW ${id} not found`);
  if (current.stage !== "commercial") {
    throw new Error("Commercial decline only applies at the Commercial stage");
  }
  return rejectSowMock(id, "commercial", comment).sow;
}

export function rejectSowMock(id: string, stage: SowStage, comment: string) {
  const current = getSowMock(id);
  if (!current) throw new Error(`SOW ${id} not found`);
  const approvals: SowApprovalSummary[] = current.approvals.map((a) =>
    a.stage === stage
      ? { ...a, decision: "rejected", approverId: OWNER, comment, decidedAt: new Date().toISOString() }
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
  const merged = transition(id, { approvals, stage: toStage });
  return {
    sow: merged,
    transition: { fromStage, advancedTo: toStage, terminal: false },
  };
}

export { overlay as sowOverlay };
