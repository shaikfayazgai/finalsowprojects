/**
 * Cross-tenant audit filter helpers.
 * Data comes from the real backend via fetchAuditEvents(); no mock defaults.
 */

import { mentorDisplayForAudit } from "@/lib/admin/mocks/mentors-service";
import type { MockAdminAuditEvent } from "@/mocks/admin/audit";
import type { AdminRole } from "@/mocks/admin/personas";

export type AuditTimeWindow = "24h" | "7d" | "30d" | "90d" | "all";

export interface AuditFilterState {
  tenant: string;
  actor: string;
  resource: string;
  action: string;
  severity: "any" | "info" | "warning" | "critical";
  time: AuditTimeWindow;
  q: string;
}

export const DEFAULT_AUDIT_FILTERS: AuditFilterState = {
  tenant: "All",
  actor: "Any",
  resource: "Any",
  action: "Any",
  severity: "any",
  time: "7d",
  q: "",
};

function windowMs(w: AuditTimeWindow): number | null {
  switch (w) {
    case "24h": return 24 * 3_600_000;
    case "7d": return 7 * 24 * 3_600_000;
    case "30d": return 30 * 24 * 3_600_000;
    case "90d": return 90 * 24 * 3_600_000;
    default: return null;
  }
}

export function listAuditActors(events: MockAdminAuditEvent[] = []): string[] {
  return Array.from(new Set(events.map((e) => e.actor))).sort();
}

export function listAuditResources(events: MockAdminAuditEvent[] = []): string[] {
  return Array.from(new Set(events.map((e) => e.resourceType))).sort();
}

/** Map tenant id, slug, or display name → filter dropdown value (no mock lookup). */
export function resolveAuditTenantFilter(raw: string): string {
  if (raw === "(internal)" || raw === "internal") return "(internal)";
  return raw;
}

const AUDIT_TIME_WINDOWS: AuditTimeWindow[] = ["24h", "7d", "30d", "90d", "all"];

/** Build filter state from ?tenant=&actor=&resource=&action=&q=&time= deep links. */
export function auditFiltersFromSearchParams(
  sp: Pick<URLSearchParams, "get">,
  actors: string[] = [],
): AuditFilterState {
  const next: AuditFilterState = { ...DEFAULT_AUDIT_FILTERS };

  const tenant = sp.get("tenant");
  if (tenant) next.tenant = resolveAuditTenantFilter(tenant);

  const resource = sp.get("resource");
  if (resource) {
    const normalized = resource === "ai_agent" ? "prompt" : resource;
    next.resource = normalized;
  }

  const action = sp.get("action");
  if (action) next.action = action;

  const time = sp.get("time");
  if (time && AUDIT_TIME_WINDOWS.includes(time as AuditTimeWindow)) {
    next.time = time as AuditTimeWindow;
  }

  const severity = sp.get("severity");
  if (severity === "info" || severity === "warning" || severity === "critical") {
    next.severity = severity;
  }

  const q = sp.get("q")?.trim() ?? "";
  const actor = sp.get("actor");
  if (actor) {
    const name = mentorDisplayForAudit(actor);
    if (actors.includes(name)) {
      next.actor = name;
    } else {
      next.q = q || name;
    }
  } else if (q) {
    next.q = q;
  }

  return next;
}

export function auditFiltersToSearchParams(filters: AuditFilterState): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.tenant !== "All") params.set("tenant", filters.tenant);
  if (filters.actor !== "Any") params.set("actor", filters.actor);
  if (filters.resource !== "Any") params.set("resource", filters.resource);
  if (filters.action !== "Any") params.set("action", filters.action);
  if (filters.severity !== "any") params.set("severity", filters.severity);
  if (filters.time !== DEFAULT_AUDIT_FILTERS.time) params.set("time", filters.time);
  if (filters.q.trim()) params.set("q", filters.q.trim());
  return params;
}

/** Spec §5.J — compliance sees all; other roles see domain-scoped slices. */
export function filterAuditEventsForRole(
  role: AdminRole,
  events: MockAdminAuditEvent[] = [],
): MockAdminAuditEvent[] {
  if (role === "plat.admin" || role === "plat.compliance") return events;

  if (role === "plat.tsm") {
    return events.filter(
      (e) =>
        e.resourceType === "tenant" ||
        /^(tenant|sow|decomp|user)\./.test(e.action) ||
        Boolean(e.tenant),
    );
  }

  if (role === "plat.tns") {
    return events.filter(
      (e) =>
        e.resourceType === "mentor" ||
        /^(mentor|review|kyc|governance)\./.test(e.action),
    );
  }

  if (role === "plat.payments") {
    return events.filter(
      (e) =>
        e.resourceType === "payout" ||
        e.resourceType === "ratecard" ||
        /^(payout|ratecard)\./.test(e.action),
    );
  }

  return events;
}

export function filterAuditEvents(
  filters: AuditFilterState,
  events: MockAdminAuditEvent[] = [],
): MockAdminAuditEvent[] {
  const ms = windowMs(filters.time);
  const cutoff = ms != null ? Date.now() - ms : null;
  const ql = filters.q.trim().toLowerCase();

  return events.filter((e) => {
    if (cutoff != null && new Date(e.timestamp).getTime() < cutoff) return false;
    if (filters.tenant === "(internal)") {
      if (e.tenant && e.tenant !== "") return false;
    } else if (filters.tenant !== "All" && (e.tenant ?? "") !== filters.tenant) {
      return false;
    }
    if (filters.actor !== "Any" && e.actor !== filters.actor) return false;
    if (filters.resource !== "Any" && e.resourceType !== filters.resource) return false;
    if (filters.action !== "Any" && e.action !== filters.action) return false;
    if (filters.severity !== "any" && e.severity !== filters.severity) return false;
    if (ql) {
      const hay = [e.actor, e.actorRole, e.action, e.resourceLabel, e.resourceId, e.tenant ?? "", e.resourceType]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(ql)) return false;
    }
    return true;
  });
}
