"use client";

/**
 * Real admin audit log — fetches the Mongo-backed `audit_log` (written by every
 * backend service) via /api/superadmin/audit-log and maps each doc into the
 * MockAdminAuditEvent shape the audit workspace already renders.
 */

import { useQuery } from "@tanstack/react-query";
import type { AdminAuditSeverity, MockAdminAuditEvent } from "@/mocks/admin/audit";

interface RawAuditDoc {
  _id?: string;
  timestamp?: string;
  actorEmail?: string | null;
  actorId?: string | null;
  actorRole?: string | null;
  action?: string;
  target?: string | null;
  targetId?: string | null;
  details?: string | null;
  service?: string | null;
  tenantId?: string | null;
  ipAddress?: string | null;
  [k: string]: unknown;
}

const STD_KEYS = new Set([
  "_id", "timestamp", "actorEmail", "actorId", "actorRole", "action", "target",
  "targetId", "details", "service", "tenantId", "ipAddress",
]);

const WARNING = /(reject|sent?_back|send_back|rework|escalat|breach|fail|deactiv|suspend|reassign)/i;
const CRITICAL = /(delete|drop|destroy|revoke|terminate|fraud|block)/i;

function severityFor(action: string): AdminAuditSeverity {
  if (CRITICAL.test(action)) return "critical";
  if (WARNING.test(action)) return "warning";
  return "info";
}

function toEvent(d: RawAuditDoc, i: number): MockAdminAuditEvent {
  const details: Record<string, string> = {};
  for (const [k, v] of Object.entries(d)) {
    if (STD_KEYS.has(k) || v == null) continue;
    details[k] = typeof v === "object" ? JSON.stringify(v) : String(v);
  }
  if (d.details) details.note = String(d.details);
  const action = d.action || "unknown";
  return {
    id: d._id || `ae-${i}`,
    timestamp: d.timestamp || new Date(0).toISOString(),
    tenantId: d.tenantId ?? undefined,
    tenant: d.tenantId ?? "",
    actor: d.actorEmail || d.actorId || "system",
    actorRole: d.actorRole || "system",
    action,
    resourceType: d.target || d.service || "—",
    resourceId: d.targetId || "",
    resourceLabel: d.targetId ? `${d.target ?? "record"} · ${d.targetId}` : (d.target || d.service || action),
    severity: severityFor(action),
    ip: d.ipAddress ?? undefined,
    details: Object.keys(details).length ? details : undefined,
  };
}

export function useAdminAuditLog() {
  const query = useQuery({
    queryKey: ["admin", "audit-log"],
    queryFn: async (): Promise<MockAdminAuditEvent[]> => {
      const res = await fetch("/api/superadmin/audit-log?page=1&page_size=200", { cache: "no-store" });
      if (!res.ok) throw new Error(`audit-log ${res.status}`);
      const body = (await res.json()) as { items?: RawAuditDoc[] };
      return (body.items ?? []).map(toEvent);
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  return { events: query.data ?? [], isLoading: query.isLoading, error: query.error };
}
