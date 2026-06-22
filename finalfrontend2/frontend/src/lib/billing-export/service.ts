/**
 * Billing + payouts CSV exporter (M24).
 *
 * `buildPayoutsCsv` and `buildBillingCsv` produce CSV blobs scoped to
 * a tenant + date range. `deliverToSftp` ships the blob to the
 * configured destination — mock mode writes to a local file under
 * /tmp/glimmora-sftp-mock/ so we can verify the bytes in dev; live
 * mode dials into the tenant's SFTP target with credentials from env
 * (live mode is gated; Phase 1 ships mock as the default).
 *
 * CSV format:
 *   - LF line endings
 *   - Header row always present
 *   - Fields are quoted only when they contain a comma, quote, or LF
 *   - Currency amounts emitted as minor units (paise/cents) to match
 *     the underlying schema; downstream ERP can divide by 100 if needed
 */

import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@/generated/prisma/client";
import type {
  CsvExportResult,
  ExportRange,
  SftpDeliveryResult,
  SftpMode,
} from "./types";

type Tx = Prisma.TransactionClient;

export class BillingExportError extends Error {
  constructor(
    message: string,
    public code: "validation" | "not_found" | "config" | "rail",
  ) {
    super(message);
    this.name = "BillingExportError";
  }
}

/* ───────────────────────── CSV utilities ───────────────────────── */

function csvField(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(fields: ReadonlyArray<string | number | null | undefined>): string {
  return fields.map(csvField).join(",");
}

function parseRange(range: ExportRange): { from: Date; to: Date } {
  const from = new Date(range.from);
  const to = new Date(range.to);
  if (Number.isNaN(from.getTime())) {
    throw new BillingExportError("Invalid `from` date", "validation");
  }
  if (Number.isNaN(to.getTime())) {
    throw new BillingExportError("Invalid `to` date", "validation");
  }
  if (to.getTime() <= from.getTime()) {
    throw new BillingExportError("`to` must be after `from`", "validation");
  }
  // Cap: 1 year window to prevent accidental full-history exports
  const ms = to.getTime() - from.getTime();
  const oneYear = 366 * 24 * 3600 * 1000;
  if (ms > oneYear) {
    throw new BillingExportError(
      "Date range exceeds 1 year (split into smaller windows)",
      "validation",
    );
  }
  return { from, to };
}

/* ───────────────────────── Payouts CSV ───────────────────────── */

const PAYOUT_HEADERS = [
  "payout_id",
  "submission_id",
  "task_id",
  "contributor_id",
  "tenant_id",
  "status",
  "amount_minor",
  "currency",
  "eligible_at",
  "requested_at",
  "sent_at",
  "failed_at",
  "external_ref",
] as const;

export async function buildPayoutsCsv(
  tx: Tx,
  range: ExportRange,
): Promise<CsvExportResult> {
  const { from, to } = parseRange(range);

  const rows = await tx.payoutRecord.findMany({
    where: {
      tenantId: range.tenantId,
      deletedAt: null,
      createdAt: { gte: from, lt: to },
    },
    orderBy: { createdAt: "asc" },
  });

  const lines: string[] = [csvRow(PAYOUT_HEADERS as unknown as readonly string[])];
  for (const r of rows) {
    lines.push(
      csvRow([
        r.id,
        r.submissionId,
        r.taskDefinitionId,
        r.contributorId,
        r.tenantId,
        r.status,
        r.amountMinor,
        r.currency,
        r.eligibleAt.toISOString(),
        r.requestedAt?.toISOString() ?? null,
        r.sentAt?.toISOString() ?? null,
        r.failedAt?.toISOString() ?? null,
        r.externalRef,
      ]),
    );
  }

  const body = lines.join("\n") + (lines.length > 0 ? "\n" : "");
  const generatedAt = new Date().toISOString();
  const filename = makeFilename("payouts", range.tenantId, from, to);

  return {
    kind: "payouts",
    filename,
    body,
    rowCount: rows.length,
    generatedAt,
    range: { from: from.toISOString(), to: to.toISOString() },
  };
}

/* ───────────────────────── Billing CSV ───────────────────────── */

const BILLING_HEADERS = [
  "order_id",
  "razorpay_order_id",
  "task_id",
  "tenant_id",
  "initiated_by_id",
  "status",
  "amount_minor",
  "currency",
  "receipt",
  "created_at",
  "paid_at",
  "failed_at",
] as const;

export async function buildBillingCsv(
  tx: Tx,
  range: ExportRange,
): Promise<CsvExportResult> {
  const { from, to } = parseRange(range);

  const rows = await tx.paymentOrder.findMany({
    where: {
      tenantId: range.tenantId,
      createdAt: { gte: from, lt: to },
    },
    orderBy: { createdAt: "asc" },
  });

  const lines: string[] = [csvRow(BILLING_HEADERS as unknown as readonly string[])];
  for (const r of rows) {
    lines.push(
      csvRow([
        r.id,
        r.razorpayOrderId,
        r.taskId,
        r.tenantId,
        r.initiatedById,
        r.status,
        r.amountMinor,
        r.currency,
        r.receipt,
        r.createdAt.toISOString(),
        r.paidAt?.toISOString() ?? null,
        r.failedAt?.toISOString() ?? null,
      ]),
    );
  }

  const body = lines.join("\n") + (lines.length > 0 ? "\n" : "");
  const generatedAt = new Date().toISOString();
  const filename = makeFilename("billing", range.tenantId, from, to);

  return {
    kind: "billing",
    filename,
    body,
    rowCount: rows.length,
    generatedAt,
    range: { from: from.toISOString(), to: to.toISOString() },
  };
}

/* ───────────────────────── Filename helper ───────────────────────── */

function makeFilename(
  kind: "payouts" | "billing",
  tenantId: string,
  from: Date,
  to: Date,
): string {
  const fromIso = from.toISOString().slice(0, 10);
  const toIso = to.toISOString().slice(0, 10);
  const safe = tenantId.replace(/[^a-zA-Z0-9-]/g, "_");
  return `glimmora_${kind}_${safe}_${fromIso}_to_${toIso}.csv`;
}

/* ───────────────────────── SFTP delivery ───────────────────────── */

export function sftpMode(): SftpMode {
  const raw = process.env.BILLING_EXPORT_SFTP_MODE?.trim().toLowerCase();
  return raw === "live" ? "live" : "mock";
}

const MOCK_SFTP_DIR = "/tmp/glimmora-sftp-mock";

/**
 * Ship a CSV blob to SFTP. Mock mode writes to a local directory so
 * the smoke test can verify the bytes round-trip. Live mode requires
 * `ssh2-sftp-client` (not installed in Phase 1 — adapter surfaces a
 * clear config error rather than installing dependencies silently).
 */
export async function deliverToSftp(
  args: { csv: CsvExportResult; tenantSlug: string },
): Promise<SftpDeliveryResult> {
  const mode = sftpMode();
  if (mode === "mock") {
    await mkdir(MOCK_SFTP_DIR, { recursive: true });
    const filepath = path.join(MOCK_SFTP_DIR, args.csv.filename);
    await writeFile(filepath, args.csv.body, "utf8");
    return {
      kind: args.csv.kind,
      filename: args.csv.filename,
      bytes: Buffer.byteLength(args.csv.body, "utf8"),
      mode: "mock",
      destination: filepath,
      deliveredAt: new Date().toISOString(),
    };
  }
  // Live mode
  const host = process.env.BILLING_EXPORT_SFTP_HOST;
  const user = process.env.BILLING_EXPORT_SFTP_USER;
  const remoteDir = process.env.BILLING_EXPORT_SFTP_REMOTE_DIR ?? "/inbox";
  if (!host || !user) {
    throw new BillingExportError(
      "Live SFTP mode requires BILLING_EXPORT_SFTP_HOST + BILLING_EXPORT_SFTP_USER",
      "config",
    );
  }
  // Live integration: would resolve `ssh2-sftp-client` here. Phase 1
  // surfaces a config error rather than installing a heavy dependency.
  throw new BillingExportError(
    "Live SFTP rail is not wired in Phase 1; add ssh2-sftp-client + provide credentials before enabling.",
    "config",
  );
}

/* ───────────────────────── Integrity helpers ───────────────────────── */

/**
 * Compute SHA-256 of the CSV body. Useful for the ERP-side handshake
 * (sender + receiver hash agreement) and for auditing.
 */
export function csvIntegrityHash(body: string): string {
  return crypto.createHash("sha256").update(body, "utf8").digest("hex");
}
