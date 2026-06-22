import { prisma } from "@/lib/db";
import { auditEmit } from "@/lib/audit";
import { planCodeFromPrismaTier } from "./tier-map";
import type { PlanCode, PlanChangeRecord } from "./types";

export type { PlanChangeRecord };

/** In-memory fallback when tenant is mock-only (no Postgres row). */
const mockPlanHistory = new Map<string, PlanChangeRecord[]>();

export function getMockPlanHistory(tenantId: string): PlanChangeRecord[] {
  return mockPlanHistory.get(tenantId) ?? [];
}

export function appendMockPlanHistory(tenantId: string, record: PlanChangeRecord): void {
  const list = mockPlanHistory.get(tenantId) ?? [];
  mockPlanHistory.set(tenantId, [record, ...list].slice(0, 50));
}

export async function recordSubscriptionPlanChange(input: {
  tenantId: string;
  fromPlan: PlanCode | null;
  toPlan: PlanCode;
  actor: {
    userId: string;
    portalRole: string;
    name?: string | null;
    sessionId?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
  contractRef?: string | null;
  source?: PlanChangeRecord["source"];
  note?: string | null;
  persistAudit?: boolean;
}): Promise<PlanChangeRecord> {
  const record: PlanChangeRecord = {
    id: `pch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    fromPlan: input.fromPlan,
    toPlan: input.toPlan,
    changedByUserId: input.actor.userId,
    changedByName: input.actor.name ?? null,
    changedByRole: input.actor.portalRole,
    source: input.source ?? "admin",
    contractRef: input.contractRef ?? null,
    note: input.note ?? null,
  };

  appendMockPlanHistory(input.tenantId, record);

  if (input.persistAudit !== false) {
    try {
      const emitted = await auditEmit({
        tenantId: input.tenantId,
        actor: {
          userId: input.actor.userId,
          portalRole: input.actor.portalRole,
          sessionId: input.actor.sessionId ?? null,
          ipAddress: input.actor.ipAddress ?? null,
          userAgent: input.actor.userAgent ?? null,
        },
        action: "subscription.plan_changed",
        resource: {
          type: "tenant_subscription",
          id: input.tenantId,
          label: `${input.fromPlan ?? "none"} → ${input.toPlan}`,
        },
        payload: {
          fromPlan: input.fromPlan,
          toPlan: input.toPlan,
          source: record.source,
          contractRef: input.contractRef ?? null,
          note: input.note ?? null,
        },
        before: input.fromPlan ? { planCode: input.fromPlan } : null,
        after: { planCode: input.toPlan },
        severity: "info",
      });
      record.id = emitted.id;
      record.at = emitted.timestamp.toISOString();
    } catch {
      /* DB unavailable — mock map entry remains */
    }
  }

  return record;
}

function auditRowToRecord(row: {
  id: string;
  timestamp: Date;
  actorUserId: string;
  actorPortalRole: string;
  payload: unknown;
  before: unknown;
  after: unknown;
}): PlanChangeRecord | null {
  const after = row.after as { planCode?: PlanCode } | null;
  const before = row.before as { planCode?: PlanCode } | null;
  const payload = row.payload as {
    fromPlan?: PlanCode | null;
    toPlan?: PlanCode;
    source?: PlanChangeRecord["source"];
    contractRef?: string | null;
    note?: string | null;
    changedByName?: string | null;
  };

  const toPlan = after?.planCode ?? payload.toPlan;
  if (!toPlan) return null;

  return {
    id: row.id,
    at: row.timestamp.toISOString(),
    fromPlan: before?.planCode ?? payload.fromPlan ?? null,
    toPlan,
    changedByUserId: row.actorUserId,
    changedByName: payload.changedByName ?? null,
    changedByRole: row.actorPortalRole,
    source: payload.source ?? "admin",
    contractRef: payload.contractRef ?? null,
    note: payload.note ?? null,
  };
}

export async function listSubscriptionPlanHistory(
  tenantId: string,
  limit = 20,
): Promise<PlanChangeRecord[]> {
  try {
    const rows = await prisma.auditEvent.findMany({
      where: { tenantId, action: "subscription.plan_changed" },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
    if (rows.length > 0) {
      return rows
        .map(auditRowToRecord)
        .filter((r): r is PlanChangeRecord => r != null);
    }
  } catch {
    /* fall through to mock */
  }

  const mock = getMockPlanHistory(tenantId);
  if (mock.length > 0) return mock.slice(0, limit);

  /* Demo seed for dev tenant */
  if (tenantId === "m19-tenant-a") {
    return [
      {
        id: "seed-pch-1",
        at: "2026-01-01T00:00:00.000Z",
        fromPlan: "pilot",
        toPlan: "enterprise",
        changedByUserId: "system",
        changedByName: "Glimmora Platform",
        changedByRole: "plat.admin",
        source: "admin",
        contractRef: "MSA-2026-DEV",
        note: "Local dev seed — enterprise tier for full feature walkthrough",
      },
    ];
  }

  return [];
}

export async function resolveFromPlanForTenant(
  tenantId: string,
): Promise<PlanCode | null> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { subscriptionTier: true },
    });
    if (!tenant) return null;
    return planCodeFromPrismaTier(tenant.subscriptionTier) as PlanCode;
  } catch {
    return null;
  }
}
