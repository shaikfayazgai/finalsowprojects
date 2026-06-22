/**
 * Audit event export (M25).
 *
 * Produces CSV / JSON / NDJSON exports of AuditEvent rows for the
 * compliance + forensic-review path (doc 06 criterion #21). Every row
 * is re-verified against its stored HMAC signature at export time so
 * downstream consumers (audit teams, regulators) can rely on the
 * `signature_valid` column to spot tampering at rest.
 *
 * Filters: tenantId, action prefix, actorUserId, resourceType, severity,
 * createdAt window. All filters are AND-combined.
 *
 * Hard limits to prevent accidental full-table dumps:
 *   - Date window must be ≤ 1 year
 *   - limit ≤ 100,000 rows
 */

import { Prisma } from "@/generated/prisma/client";
import { canonicalJson, verifyAuditEvent } from "./signature";

type Tx = Prisma.TransactionClient;

export type AuditExportFormat = "csv" | "json" | "ndjson";

export interface AuditExportFilter {
  /** When set, narrows to one tenant (or null/IS NULL for platform-scope events). */
  tenantId?: string | null;
  /** Prefix-match on action (e.g. "sow." matches all SOW events). */
  actionPrefix?: string;
  actorUserId?: string;
  resourceType?: string;
  severity?: "info" | "warning" | "critical";
  /** ISO 8601. Inclusive. */
  from?: string;
  /** ISO 8601. Exclusive. */
  to?: string;
  /** Default 10,000; max 100,000. */
  limit?: number;
}

export interface AuditExportResult {
  format: AuditExportFormat;
  body: string;
  rowCount: number;
  validSignatures: number;
  invalidSignatures: number;
  filename: string;
  generatedAt: string;
}

export class AuditExportError extends Error {
  constructor(
    message: string,
    public code: "validation",
  ) {
    super(message);
    this.name = "AuditExportError";
  }
}

/* ───────────────────────── Internals ───────────────────────── */

interface RawEvent {
  id: string;
  tenantId: string | null;
  actorUserId: string;
  actorPortalRole: string;
  actorSessionId: string | null;
  actorIpAddress: string | null;
  actorUserAgent: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceLabel: string | null;
  payload: Prisma.JsonValue;
  before: Prisma.JsonValue;
  after: Prisma.JsonValue;
  severity: string;
  signature: string | null;
  signingKeyVersion: number;
  timestamp: Date;
}

function verifyEvent(event: RawEvent): boolean {
  if (!event.signature) return false;
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
  return verifyAuditEvent(canonical, event.signature, event.signingKeyVersion);
}

function csvField(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const CSV_HEADERS = [
  "id",
  "timestamp",
  "tenant_id",
  "action",
  "severity",
  "actor_user_id",
  "actor_portal_role",
  "actor_session_id",
  "actor_ip_address",
  "actor_user_agent",
  "resource_type",
  "resource_id",
  "resource_label",
  "payload",
  "before",
  "after",
  "signing_key_version",
  "signature",
  "signature_valid",
] as const;

function rowToCsv(event: RawEvent, valid: boolean): string {
  return [
    event.id,
    event.timestamp.toISOString(),
    event.tenantId,
    event.action,
    event.severity,
    event.actorUserId,
    event.actorPortalRole,
    event.actorSessionId,
    event.actorIpAddress,
    event.actorUserAgent,
    event.resourceType,
    event.resourceId,
    event.resourceLabel,
    event.payload === null ? "" : JSON.stringify(event.payload),
    event.before === null ? "" : JSON.stringify(event.before),
    event.after === null ? "" : JSON.stringify(event.after),
    event.signingKeyVersion,
    event.signature,
    String(valid),
  ]
    .map(csvField)
    .join(",");
}

function rowToJsonObject(event: RawEvent, valid: boolean): Record<string, unknown> {
  return {
    id: event.id,
    timestamp: event.timestamp.toISOString(),
    tenantId: event.tenantId,
    action: event.action,
    severity: event.severity,
    actor: {
      userId: event.actorUserId,
      portalRole: event.actorPortalRole,
      sessionId: event.actorSessionId,
      ipAddress: event.actorIpAddress,
      userAgent: event.actorUserAgent,
    },
    resource: {
      type: event.resourceType,
      id: event.resourceId,
      label: event.resourceLabel,
    },
    payload: event.payload,
    before: event.before,
    after: event.after,
    signingKeyVersion: event.signingKeyVersion,
    signature: event.signature,
    signatureValid: valid,
  };
}

/* ───────────────────────── Public entry ───────────────────────── */

export async function buildAuditExport(
  tx: Tx,
  format: AuditExportFormat,
  filter: AuditExportFilter = {},
): Promise<AuditExportResult> {
  // Validation
  const limit = Math.min(Math.max(filter.limit ?? 10_000, 1), 100_000);

  let fromDate: Date | undefined;
  let toDate: Date | undefined;
  if (filter.from) {
    fromDate = new Date(filter.from);
    if (Number.isNaN(fromDate.getTime())) {
      throw new AuditExportError("Invalid `from` date", "validation");
    }
  }
  if (filter.to) {
    toDate = new Date(filter.to);
    if (Number.isNaN(toDate.getTime())) {
      throw new AuditExportError("Invalid `to` date", "validation");
    }
  }
  if (fromDate && toDate) {
    if (toDate.getTime() <= fromDate.getTime()) {
      throw new AuditExportError("`to` must be after `from`", "validation");
    }
    const ms = toDate.getTime() - fromDate.getTime();
    if (ms > 366 * 24 * 3600 * 1000) {
      throw new AuditExportError(
        "Date range exceeds 1 year — narrow the window",
        "validation",
      );
    }
  }
  if (filter.severity && !["info", "warning", "critical"].includes(filter.severity)) {
    throw new AuditExportError(`Invalid severity '${filter.severity}'`, "validation");
  }

  const where: Prisma.AuditEventWhereInput = {
    ...(filter.tenantId === null
      ? { tenantId: null }
      : filter.tenantId !== undefined
        ? { tenantId: filter.tenantId }
        : {}),
    ...(filter.actorUserId ? { actorUserId: filter.actorUserId } : {}),
    ...(filter.resourceType ? { resourceType: filter.resourceType } : {}),
    ...(filter.severity ? { severity: filter.severity } : {}),
    ...(filter.actionPrefix
      ? { action: { startsWith: filter.actionPrefix } }
      : {}),
    ...(fromDate || toDate
      ? {
          timestamp: {
            ...(fromDate ? { gte: fromDate } : {}),
            ...(toDate ? { lt: toDate } : {}),
          },
        }
      : {}),
  };

  const rows = (await tx.auditEvent.findMany({
    where,
    orderBy: { timestamp: "asc" },
    take: limit,
  })) as unknown as RawEvent[];

  let validCount = 0;
  let invalidCount = 0;
  const verdicts: boolean[] = [];
  for (const r of rows) {
    const v = verifyEvent(r);
    verdicts.push(v);
    if (v) validCount++;
    else invalidCount++;
  }

  const generatedAt = new Date().toISOString();
  const filenameBase = makeFilename(filter, generatedAt);
  let body: string;
  let filename: string;
  if (format === "csv") {
    const lines: string[] = [CSV_HEADERS.join(",")];
    rows.forEach((r, i) => lines.push(rowToCsv(r, verdicts[i])));
    body = lines.join("\n") + (rows.length > 0 ? "\n" : "");
    filename = `${filenameBase}.csv`;
  } else if (format === "ndjson") {
    body =
      rows
        .map((r, i) => JSON.stringify(rowToJsonObject(r, verdicts[i])))
        .join("\n") + (rows.length > 0 ? "\n" : "");
    filename = `${filenameBase}.ndjson`;
  } else {
    // json
    const arr = rows.map((r, i) => rowToJsonObject(r, verdicts[i]));
    body = JSON.stringify(
      {
        generatedAt,
        filter,
        rowCount: rows.length,
        validSignatures: validCount,
        invalidSignatures: invalidCount,
        events: arr,
      },
      null,
      2,
    );
    filename = `${filenameBase}.json`;
  }

  return {
    format,
    body,
    rowCount: rows.length,
    validSignatures: validCount,
    invalidSignatures: invalidCount,
    filename,
    generatedAt,
  };
}

function makeFilename(filter: AuditExportFilter, generatedAt: string): string {
  const stamp = generatedAt.replace(/[:.]/g, "-").slice(0, 19);
  const tenantPart = filter.tenantId
    ? `_${filter.tenantId.replace(/[^a-zA-Z0-9-]/g, "_")}`
    : filter.tenantId === null
      ? "_platform"
      : "_all";
  return `glimmora_audit${tenantPart}_${stamp}`;
}
