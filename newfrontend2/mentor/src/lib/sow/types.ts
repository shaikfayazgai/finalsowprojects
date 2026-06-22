/**
 * SOW domain types — DTOs shared between the service layer and API
 * route handlers. The Prisma row shape is internal; what the client
 * sees is one of these.
 */

export type SowStatus =
  | "draft"
  | "approval"
  | "approved"
  | "rejected"
  | "withdrawn"
  | "archived";

/**
 * Approval pipeline stages: enterprise internal gates (finance → security →
 * legal) first, then the Glimmora platform gate (last).
 */
export type SowStage = "finance" | "security" | "legal" | "platform";

export {
  APPROVAL_STAGE_ORDER,
  ENTERPRISE_APPROVAL_STAGE,
  ENTERPRISE_APPROVAL_STAGES,
  PLATFORM_APPROVAL_STAGE,
  STAGE_LABEL,
  STAGE_SLA_HOURS,
  isEnterpriseStage,
  nextApprovalStage,
  stageIndex,
} from "./approval-pipeline";

/**
 * SOW confidentiality classification (governance label).
 * Backend handoff: this should be a DB enum + drive row-level
 * visibility. "internal" is the floor — a SOW is never "public".
 */
export type SowConfidentiality = "internal" | "confidential" | "restricted";

export interface SowSummary {
  id: string;
  title: string;
  status: SowStatus;
  stage: SowStage | null;
  activeVersion: number;
  ownerId: string;
  /** Display name for owner (mock / API enrichment). */
  ownerName?: string;
  /** Enterprise tenant scope (cross-tenant admin views). */
  tenantId?: string;
  tenantName?: string;
  confidentiality: SowConfidentiality;
  submittedForApprovalAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  withdrawnAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SowVersionDetail {
  version: number;
  payload: Record<string, unknown>;
  body: string | null;
  changeNote: string | null;
  createdBy: string;
  createdAt: string;
}

export interface SowApprovalSummary {
  id: string;
  stage: SowStage;
  sowVersion: number;
  approverId: string | null;
  decision: "pending" | "approved" | "rejected" | "send_back";
  comment: string | null;
  decidedAt: string | null;
  slaDeadline: string | null;
  createdAt: string;
}

export interface SowDetail extends SowSummary {
  activeVersionDetail: SowVersionDetail | null;
  approvals: SowApprovalSummary[];
}

export interface CreateSowInput {
  title: string;
  payload: Record<string, unknown>;
  body?: string;
  confidentiality?: SowConfidentiality;
}

export interface UpdateSowDraftInput {
  title?: string;
  payload?: Record<string, unknown>;
  body?: string;
  confidentiality?: SowConfidentiality;
  changeNote?: string;
}
