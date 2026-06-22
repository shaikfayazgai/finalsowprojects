/**
 * Credential domain types (M18).
 *
 * Canonical content snapshot:
 *   {
 *     v: 1,                    // schema version
 *     credentialId,
 *     contributorId,
 *     contributorName,
 *     tenantId,
 *     tenantName,
 *     taskTitle,
 *     taskExternalKey?,
 *     skills: string[],
 *     acceptedAt,              // ISO
 *     issuedAt,                // ISO
 *     mentorReviewedBy?,       // userId of accepting mentor
 *   }
 *
 * The HMAC-SHA256 signature is computed over canonicalJson(content).
 * Public-verify endpoints reconstruct canonicalJson + recompute the
 * signature; mismatch = tampered.
 */

export type CredentialStatus = "issued" | "revoked";

export interface CredentialContentV1 {
  v: 1;
  credentialId: string;
  contributorId: string;
  contributorName: string;
  tenantId: string;
  tenantName: string;
  taskTitle: string;
  taskExternalKey?: string;
  skills: string[];
  acceptedAt: string;
  issuedAt: string;
  mentorReviewedBy?: string;
}

export interface CredentialDetail {
  id: string;
  contributorId: string;
  taskDefinitionId: string;
  submissionId: string;
  tenantId: string;
  status: CredentialStatus;
  shareSlug: string;
  content: CredentialContentV1;
  signature: string;
  signingKeyVersion: number;
  summary: string | null;
  skills: string[];
  issuedAt: string;
  revokedAt: string | null;
  revokedBy: string | null;
  revokedReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicCredentialView {
  shareSlug: string;
  status: CredentialStatus;
  content: CredentialContentV1;
  signature: string;
  signingKeyVersion: number;
  /** Result of server-side re-verification at read time. */
  signatureValid: boolean;
  revokedAt: string | null;
  revokedReason: string | null;
}
