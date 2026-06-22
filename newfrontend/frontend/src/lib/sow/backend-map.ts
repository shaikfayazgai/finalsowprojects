/**
 * Map enterprise-backend SOW rows → the frontend SowSummary / SowDetail DTOs.
 * Replaces the mock store as the single source of truth for real SOW data.
 *
 * Backend → frontend reconciliations:
 *  - title:  backend `projectTitle` → `title`
 *  - stage:  backend uses approvalStages[] (keys legal/finance/security/final/
 *            commercial); the Glimmora platform gate is `commercial` → mapped to
 *            the frontend `platform` stage.
 *  - payload: the whole row is exposed as the active-version payload so the SOW
 *            detail page can read its fields (deliverables, scope, fileUrl, …).
 */

import type {
  SowSummary,
  SowDetail,
  SowApprovalSummary,
  SowStatus,
  SowStage,
  SowConfidentiality,
} from "./types";

type Row = Record<string, unknown>;

const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);
const num = (v: unknown): number | undefined => (typeof v === "number" ? v : undefined);
const nowIso = () => new Date().toISOString();

/**
 * backend approval-stage key → frontend SowStage.
 *  - `final`      → the enterprise Tenant-admin sign-off gate.
 *  - `commercial` → the final Super admin (Glimmora platform) gate.
 */
const STAGE_MAP: Record<string, SowStage> = {
  security: "security",
  finance: "finance",
  legal: "legal",
  final: "tenant_admin",
  commercial: "platform",
  platform: "platform",
};

/**
 * Canonical gate sequence (backend keys). The current stage of an in-approval
 * SOW is the first gate that has NOT yet been approved:
 *   security → finance → legal → final (Tenant admin) → commercial (Super admin).
 * A SOW only surfaces at the Super admin queue once all four prior gates —
 * including the enterprise Tenant-admin sign-off — have signed off.
 */
const STAGE_SEQUENCE = ["security", "finance", "legal", "final", "commercial"] as const;

/** Resolve the active gate of an in-approval SOW from its approvalStages[]. */
function currentStageFromRow(r: Row): SowStage {
  const stages = Array.isArray(r.approvalStages) ? (r.approvalStages as Row[]) : [];
  const statusByKey = new Map<string, string>();
  for (const st of stages) {
    const key = (str(st.key) ?? "").toLowerCase();
    if (key) statusByKey.set(key, (str(st.status) ?? "pending").toLowerCase());
  }
  for (const key of STAGE_SEQUENCE) {
    if (statusByKey.get(key) !== "approved") return STAGE_MAP[key];
  }
  // All gates approved (transient — status flips to "approved"): treat as platform.
  return "platform";
}

/**
 * The backend SOW lifecycle uses a richer vocabulary than the frontend's
 * SowStatus (e.g. manual_sow emits 'submitted' / 'changes_requested'). Normalise
 * those to the canonical frontend statuses so the UI never receives an unknown
 * status (which previously crashed the status Chip).
 */
const SOW_STATUS_ALIAS: Record<string, SowStatus> = {
  submitted: "approval",
  in_approval: "approval",
  "in-approval": "approval",
  pending: "approval",
  changes_requested: "draft",
  sent_back: "draft",
  returned: "draft",
  accepted: "approved",
  completed: "approved",
};

function normalizeSowStatus(raw: unknown): SowStatus {
  const s = (str(raw) ?? "draft").toLowerCase();
  const known: SowStatus[] = ["draft", "approval", "approved", "rejected", "withdrawn", "archived"];
  if ((known as string[]).includes(s)) return s as SowStatus;
  return SOW_STATUS_ALIAS[s] ?? "draft";
}

export function mapBackendSummary(r: Row): SowSummary {
  const status = normalizeSowStatus(r.status);
  const created = str(r.createdAt) ?? str(r.created_at) ?? nowIso();
  const updated = str(r.updatedAt) ?? str(r.updated_at) ?? created;
  return {
    id: str(r.id) ?? "",
    title: str(r.projectTitle) ?? str(r.title) ?? "Untitled SOW",
    status,
    // The active gate = first not-yet-approved stage (finance → security →
    // legal → platform). A SOW reaches the platform commercial queue only after
    // all three enterprise internal gates have signed off.
    stage: status === "approval" ? currentStageFromRow(r) : null,
    activeVersion: num(r.activeVersion) ?? 1,
    ownerId: str(r.ownerId) ?? str(r.owner_id) ?? "",
    ownerName: str(r.clientOrganisation) ?? str(r.clientOrg),
    tenantId: str(r.tenantId) ?? str(r.tenant_id) ?? undefined,
    tenantName: str(r.clientOrganisation) ?? str(r.tenantName) ?? undefined,
    confidentiality: (str(r.confidentiality) ?? "internal") as SowConfidentiality,
    submittedForApprovalAt: str(r.submittedAt) ?? updated,
    approvedAt: status === "approved" ? (str(r.approvedAt) ?? updated) : null,
    rejectedAt: status === "rejected" ? updated : null,
    withdrawnAt: status === "withdrawn" ? updated : null,
    archivedAt: status === "archived" ? updated : null,
    createdAt: created,
    updatedAt: updated,
  };
}

export function mapBackendApprovals(r: Row): SowApprovalSummary[] {
  const stages = Array.isArray(r.approvalStages) ? (r.approvalStages as Row[]) : [];
  const created = str(r.createdAt) ?? nowIso();
  const out: SowApprovalSummary[] = [];
  for (const st of stages) {
    const key = (str(st.key) ?? "").toLowerCase();
    const stage = STAGE_MAP[key];
    if (!stage) continue; // skip backend-only stages (e.g. 'final')
    const raw = (str(st.status) ?? "pending").toLowerCase();
    const decision: SowApprovalSummary["decision"] =
      raw === "approved" ? "approved" : raw === "rejected" ? "rejected" : raw === "send_back" ? "send_back" : "pending";
    out.push({
      id: `${str(r.id)}-${key}`,
      stage,
      sowVersion: 1,
      approverId: str(st.approverId) ?? null,
      decision,
      comment: str(st.comment) ?? null,
      decidedAt: str(st.decidedAt) ?? null,
      slaDeadline: str(st.slaDeadline) ?? null,
      createdAt: created,
    });
  }
  return out;
}

export function mapBackendDetail(r: Row): SowDetail {
  const summary = mapBackendSummary(r);
  return {
    ...summary,
    activeVersionDetail: {
      version: summary.activeVersion,
      payload: r, // whole row → detail page reads fileUrl/deliverables/scope/etc.
      body: str(r.body) ?? null,
      changeNote: null,
      createdBy: summary.ownerId,
      createdAt: summary.createdAt,
    },
    approvals: mapBackendApprovals(r),
  };
}
