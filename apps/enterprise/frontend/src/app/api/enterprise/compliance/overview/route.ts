/**
 * GET /api/enterprise/compliance/overview
 *
 * Phase 1 compliance baseline (spec doc 02 §5.I.1). Returns three rollups
 * for the tenant's compliance officer:
 *
 *   1. Consent inventory — distinct contributors who've worked on this
 *      tenant's tasks, split by ndaAccepted=true|false. The full per-row
 *      Phase 2 consent inventory will replace this proxy.
 *
 *   2. Data retention — static config-driven floor (no per-entity
 *      retention rules table yet; doc 06 §13 locked these values).
 *
 *   3. Deletion requests — count of AuditEvent rows whose `action`
 *      prefix-matches deletion request actions, partitioned by pending
 *      vs. completed-in-last-30-days.
 *
 * Tenant-bound. Requires `read.compliance`. The TaskDefinition query
 * picks up tenant scope from RLS (app.tenant_id) inside ctx.withTx.
 */

import { NextResponse } from "next/server";
import { requireTenantRequest } from "@/lib/api/request-context";
import { userHasPermission } from "@/lib/auth/permissions";
import {
  effectiveRule,
  formatRule,
  type RetentionRuleSet,
} from "@/lib/retention";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface OverviewResponse {
  tenantId: string;
  consent: {
    totalContributors: number;
    withConsent: number;
    missingConsent: number;
  };
  retention: {
    auditEvents: string;
    taskEvidence: string;
    withdrawnSubmissions: string;
  };
  deletionRequests: {
    pending: number;
    completedLast30Days: number;
  };
}

export async function GET() {
  const ctx = await requireTenantRequest({
    allowedRoles: ["enterprise", "admin", "super_admin"],
  });
  if (ctx instanceof NextResponse) return ctx;

  if (!(await userHasPermission(ctx.userId, "read.compliance"))) {
    return NextResponse.json(
      { error: "forbidden", reason: "missing_permission:read.compliance" },
      { status: 403 },
    );
  }

  const data = await ctx.withTx(async (tx) => {
    const contributorRows = await tx.taskDefinition.findMany({
      where: { assignedContributorId: { not: null } },
      select: {
        assignedContributor: {
          select: {
            id: true,
            contributorProfile: { select: { ndaAccepted: true } },
          },
        },
      },
    });

    const seen = new Map<string, boolean>();
    for (const row of contributorRows) {
      if (!row.assignedContributor) continue;
      if (!seen.has(row.assignedContributor.id)) {
        seen.set(
          row.assignedContributor.id,
          row.assignedContributor.contributorProfile?.ndaAccepted ?? false,
        );
      }
    }
    const totalContributors = seen.size;
    let withConsent = 0;
    for (const accepted of seen.values()) if (accepted) withConsent += 1;
    const missingConsent = totalContributors - withConsent;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const deletionActions = [
      "user.delete_request",
      "user.deletion",
      "data.delete_request",
      "contributor.gdpr_delete",
    ];

    const pending = await tx.auditEvent.count({
      where: {
        action: { in: deletionActions.map((a) => `${a}.opened`) },
      },
    });

    const completedLast30Days = await tx.auditEvent.count({
      where: {
        action: { in: deletionActions.map((a) => `${a}.completed`) },
        timestamp: { gte: thirtyDaysAgo },
      },
    });

    const rules = ctx.tenant.retentionRules as RetentionRuleSet | null;
    const response: OverviewResponse = {
      tenantId: ctx.tenant.id,
      consent: {
        totalContributors,
        withConsent,
        missingConsent,
      },
      retention: {
        auditEvents: formatRule(effectiveRule("audit_event", rules)),
        taskEvidence: formatRule(effectiveRule("task_evidence", rules)),
        withdrawnSubmissions: formatRule(effectiveRule("submission_withdrawn", rules)),
      },
      deletionRequests: {
        pending,
        completedLast30Days,
      },
    };
    return response;
  });

  return NextResponse.json(data, { status: 200 });
}
