/**
 * Credential service (M18) — auto-issuance + public verify.
 *
 * Issuance flow:
 *   1. Mentor flips a submission to 'accepted'.
 *   2. submissions.decideSubmission calls issueCredentialOnAcceptance
 *      inside the same Prisma tx as the payout creation.
 *   3. The service snapshots the canonical content + HMAC-signs it +
 *      generates a random shareSlug.
 *   4. Idempotent via @@unique(submissionId).
 *
 * Verification flow:
 *   - getCredentialByShareSlug reconstructs canonicalJson(content) and
 *     re-signs it; mismatch means the row was tampered with at rest
 *     (the append-only audit table doesn't apply here, so this is the
 *     only safeguard).
 *
 * Phase 1 reuses AUDIT_SIGNING_KEY_V1 for HMAC. The domain "v: 1" tag
 * inside `content` distinguishes credential signatures from audit
 * signatures even when the same key signs both.
 */

import crypto from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { canonicalJson, CURRENT_KEY_VERSION } from "@/lib/audit/signature";
import type {
  CredentialContentV1,
  CredentialDetail,
  CredentialStatus,
  PublicCredentialView,
} from "./types";

type Tx = Prisma.TransactionClient;

export class CredentialServiceError extends Error {
  constructor(
    message: string,
    public code:
      | "not_found"
      | "forbidden"
      | "invalid_state"
      | "validation"
      | "conflict",
  ) {
    super(message);
    this.name = "CredentialServiceError";
  }
}

/* ───────────────────────── Signing helpers ───────────────────────── */

const SIGNING_KEY_ENV_PREFIX = "AUDIT_SIGNING_KEY_V";

function getSigningKey(version: number): string {
  const envName = `${SIGNING_KEY_ENV_PREFIX}${version}`;
  const key = process.env[envName];
  if (!key) {
    throw new Error(
      `Credential signing key not configured: env var ${envName} is required.`,
    );
  }
  return key;
}

function signContent(
  content: CredentialContentV1,
  version = CURRENT_KEY_VERSION,
): { signature: string; signingKeyVersion: number } {
  const json = canonicalJson(content);
  const key = getSigningKey(version);
  const signature = crypto
    .createHmac("sha256", key)
    .update(json)
    .digest("hex");
  return { signature, signingKeyVersion: version };
}

function verifyContent(
  content: CredentialContentV1,
  signature: string,
  version: number,
): boolean {
  try {
    const json = canonicalJson(content);
    const key = getSigningKey(version);
    const expected = crypto
      .createHmac("sha256", key)
      .update(json)
      .digest("hex");
    if (expected.length !== signature.length) return false;
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex"),
    );
  } catch {
    return false;
  }
}

/* ───────────────────────── Mappers ───────────────────────── */

function toIso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

function toCredentialDetail(row: {
  id: string;
  contributorId: string;
  taskDefinitionId: string;
  submissionId: string;
  tenantId: string;
  status: string;
  shareSlug: string;
  content: Prisma.JsonValue;
  signature: string;
  signingKeyVersion: number;
  summary: string | null;
  skills: string[];
  issuedAt: Date;
  revokedAt: Date | null;
  revokedBy: string | null;
  revokedReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}): CredentialDetail {
  return {
    id: row.id,
    contributorId: row.contributorId,
    taskDefinitionId: row.taskDefinitionId,
    submissionId: row.submissionId,
    tenantId: row.tenantId,
    status: row.status as CredentialStatus,
    shareSlug: row.shareSlug,
    content: row.content as unknown as CredentialContentV1,
    signature: row.signature,
    signingKeyVersion: row.signingKeyVersion,
    summary: row.summary,
    skills: row.skills,
    issuedAt: row.issuedAt.toISOString(),
    revokedAt: toIso(row.revokedAt),
    revokedBy: row.revokedBy,
    revokedReason: row.revokedReason,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/* ──────────────────────── Slug generation ──────────────────────── */

function generateShareSlug(): string {
  // 16-char hex = 64 bits of entropy; collisions essentially impossible
  // at Phase 1 scale. Add a retry guard at the call site if paranoid.
  return crypto.randomBytes(8).toString("hex");
}

/* ───────────────────────── Issuance ───────────────────────── */

export interface IssueCredentialInput {
  submissionId: string;
  taskDefinitionId: string;
  contributorId: string;
  contributorName: string;
  tenantId: string;
  tenantName: string;
  taskTitle: string;
  taskExternalKey?: string | null;
  skills: string[];
  acceptedAt: Date;
  mentorReviewedBy?: string | null;
}

/**
 * Idempotent: returns existing credential when one already exists for
 * the submission. The mentor accept hook calls this; retries are safe.
 */
export async function issueCredentialOnAcceptance(
  tx: Tx,
  args: IssueCredentialInput,
): Promise<CredentialDetail> {
  const existing = await tx.credential.findUnique({
    where: { submissionId: args.submissionId },
  });
  if (existing) {
    return toCredentialDetail(existing);
  }

  // Reserve an id so the content snapshot references its own credentialId.
  // Prisma will reuse this if we hand it in.
  const credentialId = crypto.randomUUID();
  const issuedAt = new Date();

  const content: CredentialContentV1 = {
    v: 1,
    credentialId,
    contributorId: args.contributorId,
    contributorName: args.contributorName,
    tenantId: args.tenantId,
    tenantName: args.tenantName,
    taskTitle: args.taskTitle,
    ...(args.taskExternalKey ? { taskExternalKey: args.taskExternalKey } : {}),
    skills: args.skills,
    acceptedAt: args.acceptedAt.toISOString(),
    issuedAt: issuedAt.toISOString(),
    ...(args.mentorReviewedBy ? { mentorReviewedBy: args.mentorReviewedBy } : {}),
  };

  const { signature, signingKeyVersion } = signContent(content);

  // Generate slug with one retry for an absurdly unlikely collision.
  let shareSlug = generateShareSlug();
  const collision = await tx.credential.findUnique({ where: { shareSlug } });
  if (collision) shareSlug = generateShareSlug();

  const summary = buildSummary(args);

  const created = await tx.credential.create({
    data: {
      id: credentialId,
      submissionId: args.submissionId,
      taskDefinitionId: args.taskDefinitionId,
      contributorId: args.contributorId,
      tenantId: args.tenantId,
      status: "issued",
      shareSlug,
      content: content as unknown as Prisma.InputJsonValue,
      signature,
      signingKeyVersion,
      summary,
      skills: args.skills,
      issuedAt,
    },
  });
  return toCredentialDetail(created);
}

function buildSummary(args: IssueCredentialInput): string {
  const skillsClause =
    args.skills.length > 0
      ? ` — ${args.skills.slice(0, 3).join(", ")}${args.skills.length > 3 ? "…" : ""}`
      : "";
  return `Delivered "${args.taskTitle}" for ${args.tenantName}${skillsClause}`;
}

/* ───────────────────────── Reads ───────────────────────── */

export async function getCredentialDetail(
  tx: Tx,
  credentialId: string,
): Promise<CredentialDetail | null> {
  const row = await tx.credential.findUnique({ where: { id: credentialId } });
  return row ? toCredentialDetail(row) : null;
}

export async function listCredentialsForContributor(
  tx: Tx,
  args: { contributorUserId: string; status?: CredentialStatus; limit?: number },
): Promise<CredentialDetail[]> {
  const rows = await tx.credential.findMany({
    where: {
      contributorId: args.contributorUserId,
      ...(args.status ? { status: args.status } : {}),
    },
    orderBy: { issuedAt: "desc" },
    take: args.limit ?? 50,
  });
  return rows.map(toCredentialDetail);
}

export async function listCredentialsForTenant(
  tx: Tx,
  args: { tenantId: string; status?: CredentialStatus; limit?: number },
): Promise<CredentialDetail[]> {
  const rows = await tx.credential.findMany({
    where: {
      tenantId: args.tenantId,
      ...(args.status ? { status: args.status } : {}),
    },
    orderBy: { issuedAt: "desc" },
    take: args.limit ?? 100,
  });
  return rows.map(toCredentialDetail);
}

/**
 * Public verify endpoint resolution. Returns null when the slug is
 * unknown. Always recomputes the signature so the caller sees fresh
 * tamper-detection.
 *
 * Even when status='revoked', returns the view with revoked metadata
 * so the public page can render "this credential has been revoked".
 */
export async function getCredentialByShareSlug(
  tx: Tx,
  shareSlug: string,
): Promise<PublicCredentialView | null> {
  const row = await tx.credential.findUnique({ where: { shareSlug } });
  if (!row) return null;
  const content = row.content as unknown as CredentialContentV1;
  const signatureValid = verifyContent(
    content,
    row.signature,
    row.signingKeyVersion,
  );
  return {
    shareSlug: row.shareSlug,
    status: row.status as CredentialStatus,
    content,
    signature: row.signature,
    signingKeyVersion: row.signingKeyVersion,
    signatureValid,
    revokedAt: toIso(row.revokedAt),
    revokedReason: row.revokedReason,
  };
}

/* ───────────────────────── Revocation ───────────────────────── */

export async function revokeCredential(
  tx: Tx,
  args: { credentialId: string; revokedBy: string; reason: string },
): Promise<CredentialDetail> {
  const cred = await tx.credential.findUnique({
    where: { id: args.credentialId },
  });
  if (!cred) throw new CredentialServiceError("Credential not found", "not_found");
  if (cred.status === "revoked") {
    throw new CredentialServiceError(
      "Credential is already revoked",
      "invalid_state",
    );
  }
  if (!args.reason.trim()) {
    throw new CredentialServiceError(
      "Revocation reason is required",
      "validation",
    );
  }
  const updated = await tx.credential.update({
    where: { id: cred.id },
    data: {
      status: "revoked",
      revokedAt: new Date(),
      revokedBy: args.revokedBy,
      revokedReason: args.reason,
    },
  });
  return toCredentialDetail(updated);
}

/* ─────────────────────── Pure helper exports ─────────────────────── */

export const __forTests = { verifyContent, signContent };
