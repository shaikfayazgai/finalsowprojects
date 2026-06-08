/**
 * Audit unified view client (UI3e). Wraps the M25 export endpoint.
 *
 * For inline browsing we call format=json with a row cap; for download
 * we trigger a CSV/JSON/NDJSON file. Each event row carries `signatureValid`
 * recomputed at read time so the UI can flag tampering.
 */

export class AuditViewApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "AuditViewApiError";
  }
}

export interface AuditViewEvent {
  id: string;
  timestamp: string;
  tenantId: string | null;
  action: string;
  severity: "info" | "warning" | "critical";
  actor: {
    userId: string;
    portalRole: string;
    sessionId: string | null;
    ipAddress: string | null;
    userAgent: string | null;
  };
  resource: {
    type: string;
    id: string;
    label: string | null;
  };
  payload: unknown;
  before: unknown;
  after: unknown;
  signingKeyVersion: number;
  signature: string | null;
  signatureValid: boolean;
}

export interface AuditViewQuery {
  actionPrefix?: string;
  severity?: "info" | "warning" | "critical";
  actorUserId?: string;
  resourceType?: string;
  from?: string;
  to?: string;
  limit?: number;
}

interface ExportJsonShape {
  generatedAt: string;
  filter: unknown;
  rowCount: number;
  validSignatures: number;
  invalidSignatures: number;
  events: AuditViewEvent[];
}

function buildQuery(q: AuditViewQuery, format: "csv" | "json" | "ndjson"): URLSearchParams {
  const params = new URLSearchParams();
  params.set("format", format);
  if (q.actionPrefix) params.set("actionPrefix", q.actionPrefix);
  if (q.severity) params.set("severity", q.severity);
  if (q.actorUserId) params.set("actorUserId", q.actorUserId);
  if (q.resourceType) params.set("resourceType", q.resourceType);
  if (q.from) params.set("from", q.from);
  if (q.to) params.set("to", q.to);
  if (q.limit) params.set("limit", String(q.limit));
  return params;
}

export async function fetchAuditEvents(q: AuditViewQuery): Promise<ExportJsonShape> {
  const params = buildQuery({ ...q, limit: q.limit ?? 200 }, "json");
  const res = await fetch(`/api/audit/export?${params.toString()}`, {
    credentials: "same-origin",
  });
  if (!res.ok) {
    let msg = res.statusText;
    let code: string | undefined;
    try {
      const body = await res.json();
      msg = body.error ?? msg;
      code = body.code;
    } catch {
      /* keep statusText */
    }
    throw new AuditViewApiError(msg, res.status, code);
  }
  return (await res.json()) as ExportJsonShape;
}

export async function downloadAuditExport(
  q: AuditViewQuery,
  format: "csv" | "json" | "ndjson",
): Promise<{ filename: string; rowCount: number; validSignatures: number; invalidSignatures: number }> {
  const params = buildQuery(q, format);
  const res = await fetch(`/api/audit/export?${params.toString()}`, {
    credentials: "same-origin",
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = await res.json();
      msg = body.error ?? msg;
    } catch {
      /* keep statusText */
    }
    throw new AuditViewApiError(msg, res.status);
  }
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const filenameMatch = disposition.match(/filename="?([^";]+)"?/);
  const filename = filenameMatch?.[1] ?? `glimmora_audit.${format}`;
  const rowCount = Number(res.headers.get("X-Audit-Row-Count") ?? "0");
  const validSignatures = Number(res.headers.get("X-Audit-Valid-Signatures") ?? "0");
  const invalidSignatures = Number(res.headers.get("X-Audit-Invalid-Signatures") ?? "0");

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return { filename, rowCount, validSignatures, invalidSignatures };
}
