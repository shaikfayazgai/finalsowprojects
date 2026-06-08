/**
 * auditEmit() — the only function code should use to write audit events.
 *
 * Synchronously writes to AuditEvent (Postgres) with an HMAC signature.
 *
 * Per cross-functional spec §4.7: audit writes are part of the state-
 * change transaction. If auditEmit() throws, the calling action MUST
 * fail (don't catch + swallow). For atomicity, pass a Prisma transaction
 * client via `options.tx`:
 *
 *     await prisma.$transaction(async (tx) => {
 *       await tx.sow.update({ where: { id }, data: { stage: 'commercial' } });
 *       await auditEmit({ ... }, { tx });
 *     });
 *
 * Without `options.tx`, the audit insert happens on the global prisma
 * client — fine for read-mostly actions or when the mutation is itself
 * a single statement.
 */

import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import {
  canonicalJson,
  signAuditEvent,
  verifyAuditEvent,
  CURRENT_KEY_VERSION,
} from "./signature";
import type { AuditEventInput, EmittedAuditEvent } from "./types";

/**
 * Prisma's interactive-transaction client type. The first arg to
 * `prisma.$transaction(async (tx) => ...)`. Has the same model surface
 * as the global client minus `$transaction` (you can't nest interactive
 * transactions).
 */
export type PrismaTx = Prisma.TransactionClient;

export interface AuditEmitOptions {
  /**
   * Optional Prisma transaction client. Pass this from inside
   * `prisma.$transaction(async (tx) => ...)` to make the audit write
   * atomic with the mutation it documents.
   */
  tx?: PrismaTx;
}

export async function auditEmit(
  input: AuditEventInput,
  options: AuditEmitOptions = {},
): Promise<EmittedAuditEvent> {
  // UUIDv4 today via Node's built-in crypto.randomUUID().
  // Phase 2 may switch to UUIDv7 (time-orderable) via the `uuid` package
  // — the schema accepts either; v4 fallback is fine because the
  // `timestamp` column already provides ordering.
  const id = crypto.randomUUID();
  const timestamp = new Date();
  const severity = input.severity ?? "info";
  const signingKeyVersion = CURRENT_KEY_VERSION;

  // Canonical event JSON — what we sign. Excludes the `signature` field
  // itself (chicken-and-egg). Field order doesn't matter for the
  // signature because canonicalJson() sorts keys alphabetically.
  const canonical = canonicalJson({
    id,
    tenantId: input.tenantId ?? null,
    actorUserId: input.actor.userId,
    actorPortalRole: input.actor.portalRole,
    actorSessionId: input.actor.sessionId ?? null,
    actorIpAddress: input.actor.ipAddress ?? null,
    actorUserAgent: input.actor.userAgent ?? null,
    action: input.action,
    resourceType: input.resource.type,
    resourceId: input.resource.id,
    resourceLabel: input.resource.label ?? null,
    payload: input.payload,
    before: input.before ?? null,
    after: input.after ?? null,
    severity,
    timestamp: timestamp.toISOString(),
    signingKeyVersion,
  });

  const signature = signAuditEvent(canonical, signingKeyVersion);

  // Prisma's strict typing for nullable JSON fields wants Prisma.JsonNull
  // (an explicit token) rather than a plain `null` literal. payload is
  // required (Json, not Json?), so it must always be a JsonValue.
  const data: Prisma.AuditEventUncheckedCreateInput = {
    id,
    tenantId: input.tenantId ?? null,
    actorUserId: input.actor.userId,
    actorPortalRole: input.actor.portalRole,
    actorSessionId: input.actor.sessionId ?? null,
    actorIpAddress: input.actor.ipAddress ?? null,
    actorUserAgent: input.actor.userAgent ?? null,
    action: input.action,
    resourceType: input.resource.type,
    resourceId: input.resource.id,
    resourceLabel: input.resource.label ?? null,
    payload: input.payload as Prisma.InputJsonValue,
    before:
      input.before == null
        ? Prisma.JsonNull
        : (input.before as Prisma.InputJsonValue),
    after:
      input.after == null
        ? Prisma.JsonNull
        : (input.after as Prisma.InputJsonValue),
    severity,
    signature,
    signingKeyVersion,
    timestamp,
  };

  if (options.tx) {
    await options.tx.auditEvent.create({ data });
  } else {
    await prisma.auditEvent.create({ data });
  }

  return { id, timestamp, signature };
}

/**
 * Read a stored audit event and verify its signature.
 *
 * Returns `{ event, signatureValid }`. Callers can decide how to handle
 * verification failure (UI display warning, alert security, etc.) —
 * this function never throws on a signature mismatch.
 */
export interface AuditReadResult {
  event: Awaited<ReturnType<typeof prisma.auditEvent.findUnique>>;
  signatureValid: boolean;
}

export async function auditRead(id: string): Promise<AuditReadResult> {
  const event = await prisma.auditEvent.findUnique({ where: { id } });
  if (!event || !event.signature) {
    return { event, signatureValid: false };
  }

  // Recompute the canonical JSON exactly as the writer did, then verify.
  const canonical = canonicalJson({
    id: event.id,
    tenantId: event.tenantId,
    actorUserId: event.actorUserId,
    actorPortalRole: event.actorPortalRole,
    actorSessionId: event.actorSessionId,
    actorIpAddress: event.actorIpAddress,
    actorUserAgent: event.actorUserAgent,
    action: event.action,
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    resourceLabel: event.resourceLabel,
    payload: event.payload,
    before: event.before,
    after: event.after,
    severity: event.severity,
    timestamp: event.timestamp.toISOString(),
    signingKeyVersion: event.signingKeyVersion,
  });

  const signatureValid = verifyAuditEvent(
    canonical,
    event.signature,
    event.signingKeyVersion,
  );

  return { event, signatureValid };
}
