/**
 * SOW backend mappers — convert the enterprise-service row shape
 * (table `enterprise_sows`, JSONB `data` column) into the frontend
 * SOW DTOs declared in src/lib/sow/types.ts.
 *
 * Backend row (the JSONB `data` document) carries camelCase fields:
 *   id, projectTitle, clientOrganisation, status, approvalStages[],
 *   createdAt, updatedAt, submittedAt, approvedAt, ...
 *
 * approvalStages item shape (canonical 5 stages):
 *   { key, title, owner, status, decidedBy, decidedAt, comment }
 *
 * Only owner_id / owner_email / created_at / updated_at live as real DB
 * columns and are NOT returned in `data`; we read the camelCase mirrors
 * inside `data` and fall back to sensible defaults.
 */

import type {
  SowApprovalSummary,
  SowConfidentiality,
  SowDetail,
  SowStage,
  SowStatus,
  SowSummary,
  SowVersionDetail,
} from "@/lib/sow/types";
import { APPROVAL_STAGE_ORDER } from "@/lib/sow/types";

/** Loose view of the backend JSONB document. */
export interface SowBackendRow {
  id: string;
  projectTitle?: string | null;
  clientOrganisation?: string | null;
  status?: string | null;
  approvalStages?: BackendStage[] | null;
  activeVersion?: number | null;
  confidentiality?: string | null;
  ownerId?: string | null;
  owner_id?: string | null;
  ownerEmail?: string | null;
  owner_email?: string | null;
  ownerName?: string | null;
  tenantId?: string | null;
  tenantName?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  updatedAt?: string | null;
  updated_at?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  withdrawnAt?: string | null;
  archivedAt?: string | null;
  closedAt?: string | null;
  body?: string | null;
  changeNote?: string | null;
  // Carry-through extras land in the version payload.
  [key: string]: unknown;
}

interface BackendStage {
  key?: string;
  title?: string;
  owner?: string;
  status?: string;
  decidedBy?: string | null;
  decidedAt?: string | null;
  comment?: string | null;
}

const VALID_STAGE = new Set<SowStage>(APPROVAL_STAGE_ORDER);

function isStage(key: string | undefined | null): key is SowStage {
  return !!key && VALID_STAGE.has(key as SowStage);
}

/** Map a backend stage decision string → frontend decision enum. */
function mapDecision(status: string | null | undefined): SowApprovalSummary["decision"] {
  switch (status) {
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "send_back":
      return "send_back";
    default:
      return "pending";
  }
}

/**
 * Map the backend SOW status → frontend SowStatus.
 * Backend produces: draft | approval | submitted | approved | rejected |
 * generated | promoted | closed | archived.
 */
function mapStatus(
  status: string | null | undefined,
  stages: SowApprovalSummary[],
): SowStatus {
  switch (status) {
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "withdrawn":
      return "withdrawn";
    case "closed":
    case "archived":
      return "archived";
    case "draft":
      return "draft";
    case "submitted":
    case "approval":
      return "approval";
    default:
      // generated / promoted / unknown — if any stage is mid-flight treat it as
      // in-approval, else default to draft.
      if (stages.some((s) => s.decision === "pending") && stages.length > 0) {
        return "approval";
      }
      return "draft";
  }
}

function mapConfidentiality(value: string | null | undefined): SowConfidentiality {
  if (value === "confidential" || value === "restricted") return value;
  return "internal";
}

/**
 * Convert backend approvalStages[] → SowApprovalSummary[] in canonical order.
 * Missing stages are synthesised as pending so the UI always shows the 5 gates.
 */
export function mapApprovalStages(row: SowBackendRow): SowApprovalSummary[] {
  const stages = Array.isArray(row.approvalStages) ? row.approvalStages : [];
  const byKey = new Map<string, BackendStage>();
  for (const s of stages) {
    if (s && typeof s.key === "string") byKey.set(s.key, s);
  }
  const version = row.activeVersion ?? 1;
  const createdAt = row.createdAt ?? row.created_at ?? row.submittedAt ?? new Date(0).toISOString();

  return APPROVAL_STAGE_ORDER.map((stage) => {
    const b = byKey.get(stage) ?? {};
    return {
      id: `${row.id}:${stage}`,
      stage,
      sowVersion: version,
      approverId: b.decidedBy ?? null,
      decision: mapDecision(b.status),
      comment: b.comment ?? null,
      decidedAt: b.decidedAt ?? null,
      slaDeadline: null,
      createdAt,
    };
  });
}

/**
 * Derive the current (active) stage = the first canonical stage that is still
 * pending. Returns null when every stage is decided.
 */
function deriveCurrentStage(approvals: SowApprovalSummary[]): SowStage | null {
  for (const stage of APPROVAL_STAGE_ORDER) {
    const a = approvals.find((x) => x.stage === stage);
    if (a && a.decision === "pending") return stage;
  }
  return null;
}

export function mapRowToSowSummary(row: SowBackendRow): SowSummary {
  const approvals = mapApprovalStages(row);
  const status = mapStatus(row.status, approvals);
  const createdAt = row.createdAt ?? row.created_at ?? new Date().toISOString();
  const updatedAt = row.updatedAt ?? row.updated_at ?? createdAt;

  return {
    id: row.id,
    title: row.projectTitle ?? "Untitled SOW",
    status,
    stage: deriveCurrentStage(approvals),
    activeVersion: row.activeVersion ?? 1,
    ownerId: row.ownerId ?? row.owner_id ?? row.ownerEmail ?? row.owner_email ?? "",
    ownerName: row.ownerName ?? row.ownerEmail ?? row.owner_email ?? undefined,
    tenantId: row.tenantId ?? undefined,
    tenantName: row.tenantName ?? row.clientOrganisation ?? undefined,
    confidentiality: mapConfidentiality(row.confidentiality),
    submittedForApprovalAt: row.submittedAt ?? null,
    approvedAt: row.approvedAt ?? null,
    rejectedAt: row.rejectedAt ?? null,
    withdrawnAt: row.withdrawnAt ?? null,
    archivedAt: row.archivedAt ?? row.closedAt ?? null,
    createdAt,
    updatedAt,
  };
}

export function mapRowToSowDetail(row: SowBackendRow): SowDetail {
  const summary = mapRowToSowSummary(row);
  const approvals = mapApprovalStages(row);

  const activeVersionDetail: SowVersionDetail = {
    version: summary.activeVersion,
    payload: row as Record<string, unknown>,
    body: typeof row.body === "string" ? row.body : null,
    changeNote: typeof row.changeNote === "string" ? row.changeNote : null,
    createdBy: summary.ownerId,
    createdAt: summary.createdAt,
  };

  return {
    ...summary,
    activeVersionDetail,
    approvals,
  };
}

/** Re-exported for callers needing stage helpers without importing types twice. */
export { deriveCurrentStage, isStage };
