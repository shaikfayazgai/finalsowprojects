/**
 * KYC domain types (M23).
 *
 * One KycCheck row per attempt. Contributors can have multiple over
 * time (rejected → re-attempted, periodic re-verification). Service
 * enforces at most one in-flight (non-terminal) row per contributor.
 *
 * Lifecycle:
 *   pending → submitted → under_review → approved   (terminal)
 *                                       → rejected   (terminal)
 *                                       → hold       (returns to contributor for more info; resubmit returns to 'submitted')
 */

export type KycStatus =
  | "pending"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "hold";

export type DocumentKind =
  | "id_card"
  | "address_proof"
  | "pan"
  | "passport"
  | "other";

export interface KycDocumentRef {
  kind: DocumentKind;
  name: string;
  url: string;
  mimeType?: string;
  sizeBytes?: number;
}

export interface KycCheckDetail {
  id: string;
  contributorId: string;
  status: KycStatus;
  documents: KycDocumentRef[];
  riskScore: number | null;
  assigneeId: string | null;
  assignedAt: string | null;
  submittedAt: string | null;
  decidedAt: string | null;
  decidedBy: string | null;
  decisionReason: string | null;
  heldAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitKycInput {
  documents: KycDocumentRef[];
}

export type KycDecision = "approved" | "rejected" | "hold";

export interface DecideKycInput {
  decision: KycDecision;
  /** Required for rejected + hold; optional for approved. */
  reason?: string;
}
