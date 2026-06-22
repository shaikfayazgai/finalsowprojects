/**
 * Billing-export domain types (M24).
 *
 * Two CSV exports for finance / ERP integration:
 *   - payouts:  one row per PayoutRecord in the date range
 *   - billing:  one row per PaymentOrder (inbound payment) in the range
 *
 * Both share the per-tenant scoping + date filter shape.
 */

export type ExportKind = "payouts" | "billing";

export interface ExportRange {
  tenantId: string;
  /** ISO 8601 — inclusive lower bound (createdAt). */
  from: string;
  /** ISO 8601 — exclusive upper bound (createdAt). */
  to: string;
}

export interface CsvExportResult {
  kind: ExportKind;
  filename: string;
  /** CSV body including header row, LF line endings, UTF-8. */
  body: string;
  /** Row count NOT including the header. */
  rowCount: number;
  /** Date window snapshot for traceability. */
  generatedAt: string;
  range: { from: string; to: string };
}

export type SftpMode = "mock" | "live";

export interface SftpDeliveryResult {
  kind: ExportKind;
  filename: string;
  bytes: number;
  mode: SftpMode;
  /** Destination ref — local file path in mock mode; remote path in live. */
  destination: string;
  deliveredAt: string;
}
