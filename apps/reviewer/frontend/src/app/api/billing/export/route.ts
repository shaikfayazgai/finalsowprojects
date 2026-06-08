/**
 * GET /api/billing/export
 *
 * Triggers the M24 CSV export and returns the bytes as a download.
 * Permission: export.billing. Tenant-bound — non-platform users are
 * scoped to their own tenant.
 *
 * Query params:
 *   - kind: 'payouts' | 'billing' (default 'payouts')
 *   - from, to: ISO 8601 (required)
 *   - tenantId: only honored when caller is platform-scope; tenant-
 *               bound users are forced to their own tenant.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRequest } from "@/lib/api/request-context";
import { userHasPermission } from "@/lib/auth/permissions";
import {
  BillingExportError,
  buildBillingCsv,
  buildPayoutsCsv,
  csvIntegrityHash,
  type ExportKind,
} from "@/lib/billing-export";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = await requireRequest();
  if (ctx instanceof NextResponse) return ctx;

  if (!(await userHasPermission(ctx.userId, "export.billing"))) {
    return NextResponse.json(
      { error: "forbidden", reason: "missing_permission:export.billing" },
      { status: 403 },
    );
  }

  const url = new URL(req.url);
  const kindParam = (url.searchParams.get("kind") ?? "payouts") as ExportKind;
  if (kindParam !== "payouts" && kindParam !== "billing") {
    return NextResponse.json(
      { error: `Invalid kind '${kindParam}' (expected payouts|billing)` },
      { status: 400 },
    );
  }
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json(
      { error: "from and to query params are required (ISO 8601)" },
      { status: 400 },
    );
  }

  // Resolve tenant: tenant-bound caller is locked to their own
  const rawTenantId = url.searchParams.get("tenantId");
  let targetTenantId: string;
  if (ctx.tenant) {
    targetTenantId = ctx.tenant.id;
  } else {
    const isPlatformOperator = await userHasPermission(ctx.userId, "read.audit");
    if (!isPlatformOperator || !rawTenantId) {
      return NextResponse.json(
        { error: "forbidden", reason: "no_tenant_context" },
        { status: 403 },
      );
    }
    targetTenantId = rawTenantId;
  }

  try {
    const result = await prisma.$transaction((tx) => {
      const range = { tenantId: targetTenantId, from, to };
      return kindParam === "payouts"
        ? buildPayoutsCsv(tx, range)
        : buildBillingCsv(tx, range);
    });

    const integrityHash = csvIntegrityHash(result.body);

    // Audit the export
    await ctx.audit({
      tenantId: targetTenantId,
      action: "billing.export",
      resource: { type: "billing", id: result.filename, label: kindParam },
      payload: {
        kind: kindParam,
        from,
        to,
        rowCount: result.rowCount,
        integrityHash,
      },
      severity: "info",
    });

    return new NextResponse(result.body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "X-Billing-Row-Count": String(result.rowCount),
        "X-Billing-Integrity-Sha256": integrityHash,
      },
    });
  } catch (err) {
    if (err instanceof BillingExportError) {
      const status = err.code === "validation" ? 400 : err.code === "config" ? 500 : 500;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    // eslint-disable-next-line no-console
    console.error("[billing.export]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
