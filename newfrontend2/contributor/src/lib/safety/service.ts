/**
 * Safety-report service (M22).
 *
 *   - fileSafetyReport — any authenticated user; triggers fan-out
 *     notification to T&S team
 *   - claimSafetyReport / releaseSafetyReportClaim — T&S triage
 *   - resolveSafetyReport — record terminal status + action
 *   - listSafetyReportQueue — triage view
 *   - listMySafetyReports — reporter's own
 *   - getReportDetail
 *
 * Cross-tenant: reports are global; tenantId is informational about
 * the subject. App-layer scoping enforces who reads what:
 *   - reporter: own reports
 *   - tenant operators (ent.admin / ent.pmo / ent.reviewer): tenant scope
 *   - T&S / plat.admin / plat.compliance: all
 *
 * Notifications:
 *   - On submit: fan-out `safety.case_received` (critical) to T&S
 *   - On resolve/dismiss/escalate: notify the reporter
 */

import { Prisma } from "@/generated/prisma/client";
import { dispatchNotification } from "@/lib/notifications";
import type { AuditActor } from "@/lib/audit";
import type {
  FileReportInput,
  ResolveReportInput,
  ResolutionAction,
  SafetyCategory,
  SafetyReportDetail,
  SafetySeverity,
  SafetyStatus,
  SubjectKind,
} from "./types";

type Tx = Prisma.TransactionClient;

export class SafetyServiceError extends Error {
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
    this.name = "SafetyServiceError";
  }
}

/* ───────────────────────── Validation ───────────────────────── */

const SUBJECT_KINDS: ReadonlyArray<SubjectKind> = [
  "user",
  "task",
  "tenant",
  "submission",
  "comment",
];
const CATEGORIES: ReadonlyArray<SafetyCategory> = [
  "harassment",
  "fraud",
  "spam",
  "unsafe_work",
  "plagiarism",
  "other",
];
const SEVERITIES: ReadonlyArray<SafetySeverity> = [
  "immediate",
  "high",
  "normal",
  "low",
];
const RESOLUTION_ACTIONS: ReadonlyArray<ResolutionAction> = [
  "no_action",
  "warning_issued",
  "account_suspended",
  "content_removed",
  "tenant_paused",
  "external_handoff",
  "duplicate",
];

/* ───────────────────────── Mappers ───────────────────────── */

function toIso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

function toDetail(row: {
  id: string;
  reporterId: string;
  subjectKind: string;
  subjectId: string;
  tenantId: string | null;
  category: string;
  severity: string;
  description: string;
  evidence: Prisma.JsonValue;
  status: string;
  assigneeId: string | null;
  assignedAt: Date | null;
  decidedAt: Date | null;
  decidedBy: string | null;
  resolutionAction: string | null;
  resolutionNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}): SafetyReportDetail {
  return {
    id: row.id,
    reporterId: row.reporterId,
    subjectKind: row.subjectKind as SubjectKind,
    subjectId: row.subjectId,
    tenantId: row.tenantId,
    category: row.category as SafetyCategory,
    severity: row.severity as SafetySeverity,
    description: row.description,
    evidence: (row.evidence ?? null) as Record<string, unknown> | null,
    status: row.status as SafetyStatus,
    assigneeId: row.assigneeId,
    assignedAt: toIso(row.assignedAt),
    decidedAt: toIso(row.decidedAt),
    decidedBy: row.decidedBy,
    resolutionAction: row.resolutionAction as ResolutionAction | null,
    resolutionNote: row.resolutionNote,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/* ───────────────────────── File a report ───────────────────────── */

export async function fileSafetyReport(
  tx: Tx,
  args: { reporterUserId: string; input: FileReportInput; actor: AuditActor },
): Promise<SafetyReportDetail> {
  const { reporterUserId, input } = args;

  if (!SUBJECT_KINDS.includes(input.subjectKind)) {
    throw new SafetyServiceError(
      `Invalid subjectKind '${input.subjectKind}'`,
      "validation",
    );
  }
  if (!input.subjectId.trim()) {
    throw new SafetyServiceError("subjectId required", "validation");
  }
  if (!CATEGORIES.includes(input.category)) {
    throw new SafetyServiceError(
      `Invalid category '${input.category}'`,
      "validation",
    );
  }
  const severity = input.severity ?? "normal";
  if (!SEVERITIES.includes(severity)) {
    throw new SafetyServiceError(
      `Invalid severity '${severity}'`,
      "validation",
    );
  }
  if (!input.description.trim() || input.description.length < 20) {
    throw new SafetyServiceError(
      "Description must be at least 20 characters",
      "validation",
    );
  }

  // Don't allow reporting yourself (sanity)
  if (input.subjectKind === "user" && input.subjectId === reporterUserId) {
    throw new SafetyServiceError(
      "Cannot file a report about yourself",
      "validation",
    );
  }

  const row = await tx.safetyReport.create({
    data: {
      reporterId: reporterUserId,
      subjectKind: input.subjectKind,
      subjectId: input.subjectId,
      tenantId: input.tenantId ?? null,
      category: input.category,
      severity,
      description: input.description,
      evidence: (input.evidence as Prisma.InputJsonValue | undefined) ?? Prisma.JsonNull,
      status: "open",
    },
  });

  // Fan-out to T&S team — find users with triage.safety_report permission
  const triagers = await findSafetyTriagers(tx);
  const failures: string[] = [];
  for (const recipientUserId of triagers) {
    if (recipientUserId === reporterUserId) continue; // don't notify yourself
    try {
      await dispatchNotification(
        {
          recipientUserId,
          tenantId: row.tenantId,
          kind: "safety.case_received",
          severity: severity === "immediate" ? "critical" : "important",
          title:
            severity === "immediate"
              ? `IMMEDIATE: new ${input.category} report`
              : `New ${input.category} safety report`,
          body: `Subject: ${input.subjectKind}/${input.subjectId}. Severity: ${severity}.`,
          actionUrl: `/admin/governance/safety/${row.id}`,
          actionLabel: "Open report",
          resourceType: "safety_report",
          resourceId: row.id,
        },
        { tx, actor: args.actor },
      );
    } catch (err) {
      failures.push(recipientUserId);
      // eslint-disable-next-line no-console
      console.warn(
        `[fileSafetyReport] T&S dispatch failed for ${recipientUserId}`,
        err,
      );
    }
  }

  void failures;
  return toDetail(row);
}

/* ───────────────────────── Triage ───────────────────────── */

async function loadReport(tx: Tx, id: string) {
  const r = await tx.safetyReport.findFirst({
    where: { id, deletedAt: null },
  });
  if (!r) throw new SafetyServiceError("Report not found", "not_found");
  return r;
}

export async function claimSafetyReport(
  tx: Tx,
  args: { reportId: string; assigneeUserId: string },
): Promise<SafetyReportDetail> {
  const r = await loadReport(tx, args.reportId);
  if (r.status !== "open" && r.status !== "triaging") {
    throw new SafetyServiceError(
      `Cannot claim a report in '${r.status}' state`,
      "invalid_state",
    );
  }
  if (r.assigneeId && r.assigneeId !== args.assigneeUserId) {
    throw new SafetyServiceError(
      "Report is already claimed by another triager",
      "conflict",
    );
  }
  const updated = await tx.safetyReport.update({
    where: { id: r.id },
    data: {
      status: "triaging",
      assigneeId: args.assigneeUserId,
      assignedAt:
        r.assigneeId === args.assigneeUserId && r.assignedAt
          ? r.assignedAt
          : new Date(),
    },
  });
  return toDetail(updated);
}

export async function releaseSafetyReportClaim(
  tx: Tx,
  args: { reportId: string; assigneeUserId: string },
): Promise<SafetyReportDetail> {
  const r = await loadReport(tx, args.reportId);
  if (r.assigneeId !== args.assigneeUserId) {
    throw new SafetyServiceError(
      "Only the current assignee can release",
      "forbidden",
    );
  }
  if (r.status !== "triaging") {
    throw new SafetyServiceError(
      `Cannot release a report in '${r.status}' state`,
      "invalid_state",
    );
  }
  const updated = await tx.safetyReport.update({
    where: { id: r.id },
    data: { status: "open", assigneeId: null, assignedAt: null },
  });
  return toDetail(updated);
}

export async function resolveSafetyReport(
  tx: Tx,
  args: {
    reportId: string;
    assigneeUserId: string;
    input: ResolveReportInput;
    actor: AuditActor;
  },
): Promise<SafetyReportDetail> {
  const r = await loadReport(tx, args.reportId);
  if (r.assigneeId !== args.assigneeUserId) {
    throw new SafetyServiceError(
      "Only the current assignee can resolve",
      "forbidden",
    );
  }
  if (r.status !== "triaging") {
    throw new SafetyServiceError(
      `Cannot resolve a report in '${r.status}' state — claim it first`,
      "invalid_state",
    );
  }
  if (!RESOLUTION_ACTIONS.includes(args.input.action)) {
    throw new SafetyServiceError(
      `Invalid resolutionAction '${args.input.action}'`,
      "validation",
    );
  }
  // Note required when the action actually changes something
  const actionsRequiringNote: ResolutionAction[] = [
    "warning_issued",
    "account_suspended",
    "content_removed",
    "tenant_paused",
    "external_handoff",
  ];
  if (
    actionsRequiringNote.includes(args.input.action) &&
    !args.input.note?.trim()
  ) {
    throw new SafetyServiceError(
      `Resolution action '${args.input.action}' requires a note`,
      "validation",
    );
  }

  // Decide terminal status from the input flags
  let terminal: SafetyStatus;
  if (args.input.escalate) terminal = "escalated_external";
  else if (args.input.dismiss || args.input.action === "no_action" || args.input.action === "duplicate")
    terminal = "dismissed";
  else terminal = "resolved";

  const now = new Date();
  const updated = await tx.safetyReport.update({
    where: { id: r.id },
    data: {
      status: terminal,
      decidedAt: now,
      decidedBy: args.assigneeUserId,
      resolutionAction: args.input.action,
      resolutionNote: args.input.note ?? null,
    },
  });

  // Notify the reporter of the outcome
  try {
    await dispatchNotification(
      {
        recipientUserId: r.reporterId,
        tenantId: r.tenantId,
        kind: "governance.case_resolved",
        severity: "important",
        title:
          terminal === "resolved"
            ? "Your safety report was resolved"
            : terminal === "dismissed"
              ? "Your safety report was reviewed and closed"
              : "Your safety report was escalated externally",
        body: args.input.note?.trim()
          ? `Action: ${args.input.action}. Note: ${args.input.note}`
          : `Action: ${args.input.action}.`,
        actionUrl: `/contributor/support/safety/${r.id}`,
        actionLabel: "View case",
        resourceType: "safety_report",
        resourceId: r.id,
      },
      { tx, actor: args.actor },
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[resolveSafetyReport] reporter notify failed", err);
  }

  return toDetail(updated);
}

/* ───────────────────────── Triager resolution ───────────────────── */

/**
 * Find every userId who can triage safety reports. Used by the
 * `safety.case_received` fan-out on submit.
 */
export async function findSafetyTriagers(tx: Tx): Promise<string[]> {
  const rows = await tx.userRole.findMany({
    where: {
      role: {
        rolePermissions: {
          some: { permissionCode: "triage.safety_report" },
        },
      },
    },
    select: { userId: true },
    distinct: ["userId"],
  });
  return rows.map((r) => r.userId);
}

/* ───────────────────────── Reads ───────────────────────── */

export async function getSafetyReportDetail(
  tx: Tx,
  reportId: string,
): Promise<SafetyReportDetail | null> {
  const row = await tx.safetyReport.findFirst({
    where: { id: reportId, deletedAt: null },
  });
  return row ? toDetail(row) : null;
}

export interface ListQueueOptions {
  /** When set, returns only reports claimed by this user. */
  assigneeId?: string;
  /** When set, returns only unclaimed reports. Mutually exclusive with assigneeId. */
  unclaimedOnly?: boolean;
  statuses?: SafetyStatus[];
  severities?: SafetySeverity[];
  /** Subject filter (e.g. user=X to find all reports about user X). */
  subjectKind?: SubjectKind;
  subjectId?: string;
  limit?: number;
}

export async function listSafetyReportQueue(
  tx: Tx,
  options: ListQueueOptions = {},
): Promise<SafetyReportDetail[]> {
  const where: Prisma.SafetyReportWhereInput = {
    deletedAt: null,
    ...(options.assigneeId ? { assigneeId: options.assigneeId } : {}),
    ...(options.unclaimedOnly ? { assigneeId: null } : {}),
    ...(options.statuses && options.statuses.length > 0
      ? { status: { in: options.statuses } }
      : { status: { in: ["open", "triaging"] } }),
    ...(options.severities && options.severities.length > 0
      ? { severity: { in: options.severities } }
      : {}),
    ...(options.subjectKind ? { subjectKind: options.subjectKind } : {}),
    ...(options.subjectId ? { subjectId: options.subjectId } : {}),
  };
  // Severity priority: immediate > high > normal > low; then oldest first
  const SEV_RANK: Record<SafetySeverity, number> = {
    immediate: 0,
    high: 1,
    normal: 2,
    low: 3,
  };
  const rows = await tx.safetyReport.findMany({
    where,
    take: options.limit ?? 50,
    orderBy: { createdAt: "asc" },
  });
  // Sort in JS by severity rank then createdAt (Prisma can't do this in one
  // orderBy without a stored severity_rank column).
  rows.sort((a, b) => {
    const aRank = SEV_RANK[a.severity as SafetySeverity] ?? 9;
    const bRank = SEV_RANK[b.severity as SafetySeverity] ?? 9;
    if (aRank !== bRank) return aRank - bRank;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
  return rows.map(toDetail);
}

export async function listMySafetyReports(
  tx: Tx,
  args: { reporterUserId: string; limit?: number },
): Promise<SafetyReportDetail[]> {
  const rows = await tx.safetyReport.findMany({
    where: { reporterId: args.reporterUserId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: args.limit ?? 50,
  });
  return rows.map(toDetail);
}
