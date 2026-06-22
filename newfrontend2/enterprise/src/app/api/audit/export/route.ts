/**
 * GET /api/audit/export
 *
 * Export audit events in CSV / JSON / NDJSON with filters. Permission:
 * `export.audit`. Tenant operators are constrained to their own tenant
 * (the route forces tenantId from the auth context); platform admins
 * can pass an explicit tenantId in the query string OR `tenantId=null`
 * for platform-scope events.
 *
 * Query params:
 *   - format: 'csv' | 'json' | 'ndjson' (default 'json')
 *   - tenantId: tenant slug or 'null' or 'all' (plat.admin only)
 *   - actionPrefix
 *   - actorUserId
 *   - resourceType
 *   - severity: 'info' | 'warning' | 'critical'
 *   - from, to (ISO 8601)
 *   - limit (max 100_000)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRequest } from "@/lib/api/request-context";
import { userHasPermission } from "@/lib/auth/permissions";
import {
  AuditExportError,
  buildAuditExport,
  type AuditExportFilter,
  type AuditExportFormat,
} from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_FORMATS: AuditExportFormat[] = ["csv", "json", "ndjson"];

const CONTENT_TYPES: Record<AuditExportFormat, string> = {
  csv: "text/csv; charset=utf-8",
  json: "application/json; charset=utf-8",
  ndjson: "application/x-ndjson; charset=utf-8",
};

export async function GET(req: NextRequest) {
  const ctx = await requireRequest();
  if (ctx instanceof NextResponse) return ctx;

  if (!(await userHasPermission(ctx.userId, "export.audit"))) {
    return NextResponse.json(
      { error: "forbidden", reason: "missing_permission:export.audit" },
      { status: 403 },
    );
  }

  const url = new URL(req.url);
  const formatParam = (url.searchParams.get("format") ?? "json") as AuditExportFormat;
  if (!VALID_FORMATS.includes(formatParam)) {
    return NextResponse.json(
      { error: `Invalid format '${formatParam}' (expected csv|json|ndjson)` },
      { status: 400 },
    );
  }

  // tenantId resolution: tenant operators can ONLY see their own tenant.
  // Platform admins can pass tenantId=null (platform events), explicit id,
  // or omit it entirely for all.
  const rawTenantId = url.searchParams.get("tenantId");
  const isPlatformOperator = await userHasPermission(ctx.userId, "read.audit"); // platform-wide read
  let tenantFilter: AuditExportFilter["tenantId"];
  if (ctx.tenant) {
    // Tenant-bound user — force their tenant
    tenantFilter = ctx.tenant.id;
  } else if (isPlatformOperator) {
    if (rawTenantId === "null") tenantFilter = null;
    else if (rawTenantId === "all" || rawTenantId === null) tenantFilter = undefined;
    else tenantFilter = rawTenantId;
  } else {
    return NextResponse.json(
      { error: "forbidden", reason: "no_tenant_context" },
      { status: 403 },
    );
  }

  const filter: AuditExportFilter = {
    tenantId: tenantFilter,
    actionPrefix: url.searchParams.get("actionPrefix") ?? undefined,
    actorUserId: url.searchParams.get("actorUserId") ?? undefined,
    resourceType: url.searchParams.get("resourceType") ?? undefined,
    severity:
      (url.searchParams.get("severity") as AuditExportFilter["severity"]) ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    limit: url.searchParams.get("limit")
      ? Number(url.searchParams.get("limit"))
      : undefined,
  };

  try {
    const result = await ctx.withTx((tx) => buildAuditExport(tx, formatParam, filter));
    // Audit emit on the export itself — the audit log auditing itself
    await ctx.audit(
      {
        action: "audit.export",
        resource: { type: "audit_event", id: "batch", label: result.filename },
        payload: {
          format: formatParam,
          filter,
          rowCount: result.rowCount,
          validSignatures: result.validSignatures,
          invalidSignatures: result.invalidSignatures,
        },
        severity: result.invalidSignatures > 0 ? "warning" : "info",
      },
    );

    return new NextResponse(result.body, {
      status: 200,
      headers: {
        "Content-Type": CONTENT_TYPES[formatParam],
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "X-Audit-Row-Count": String(result.rowCount),
        "X-Audit-Valid-Signatures": String(result.validSignatures),
        "X-Audit-Invalid-Signatures": String(result.invalidSignatures),
      },
    });
  } catch (err) {
    if (err instanceof AuditExportError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 400 },
      );
    }
    // eslint-disable-next-line no-console
    console.error("[audit.export]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
