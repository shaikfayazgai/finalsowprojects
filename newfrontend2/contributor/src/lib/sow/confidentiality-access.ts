import { isSowOwner } from "@/lib/enterprise/rbac";
import type { EnterpriseRole } from "@/lib/enterprise/tenant-roles-shared";
import { parseSubmissionPayload } from "@/lib/sow/intake-payload";
import type { SowConfidentiality } from "@/lib/sow/types";

function normalizeEmail(email: string | null | undefined): string | null {
  const value = email?.trim().toLowerCase();
  return value ? value : null;
}

function approverEmailsFromPayload(payload: Record<string, unknown> | null | undefined): Set<string> {
  if (!payload || typeof payload !== "object") return new Set();
  const rawSubmission = (payload as Record<string, unknown>).submission;
  const submission = parseSubmissionPayload(rawSubmission);
  const emails = new Set<string>();
  if (!submission) return emails;

  for (const ref of Object.values(submission.approvers)) {
    const email = normalizeEmail(ref?.email);
    if (email) emails.add(email);
  }
  return emails;
}

export interface SowConfidentialityAccessInput {
  confidentiality: SowConfidentiality;
  roles: EnterpriseRole[];
  actorEmail?: string | null;
  ownerId: string;
  payload?: Record<string, unknown> | null;
}

/**
 * Confidentiality visibility policy for enterprise portal consumers.
 *
 * internal:
 *   - any enterprise role already allowed into the SOW workspace.
 * confidential:
 *   - admin, owner, sponsor/pmo personas, or explicitly configured approver.
 * restricted:
 *   - admin, owner, or explicitly configured approver only.
 */
export function canViewSowByConfidentiality(input: SowConfidentialityAccessInput): boolean {
  const actorEmail = normalizeEmail(input.actorEmail);
  if (!actorEmail || input.roles.length === 0) return false;

  const isAdmin = input.roles.includes("admin");
  const hasCoreSowRole =
    isAdmin || input.roles.includes("sponsor") || input.roles.includes("pmo");
  const owner = isSowOwner(actorEmail, input.ownerId);
  const approverEmails = approverEmailsFromPayload(input.payload ?? null);
  const isConfiguredApprover = approverEmails.has(actorEmail);

  if (input.confidentiality === "internal") {
    // Loosest tier: any enterprise role already in the workspace can view
    // (the empty-roles guard above already fails closed for outsiders).
    return true;
  }
  if (input.confidentiality === "confidential") {
    // Stricter: core SOW personas (admin/sponsor/pmo), the owner, or a
    // configured approver — NOT every enterprise role.
    return hasCoreSowRole || owner || isConfiguredApprover;
  }
  // restricted — strictest: admin, owner, or configured approver only.
  return isAdmin || owner || isConfiguredApprover;
}
