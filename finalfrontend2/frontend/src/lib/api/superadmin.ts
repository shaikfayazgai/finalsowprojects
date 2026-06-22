/**
 * Superadmin API client — user provisioning + tenant registry via platform backend.
 */

import type { MockTenant, TenantUserRow } from "@/mocks/admin/tenants";

// ── Tenant list/detail ────────────────────────────────────────────────────

/**
 * Raw shape returned by GET /api/superadmin/tenants (gateway).
 * The backend may use snake_case or slightly different field names; this
 * intermediate type drives the mapper below.
 */
interface RawTenant {
  id: string;
  name: string;
  domain?: string;
  tier?: string;
  status?: string;
  users?: number;
  user_count?: number;
  sows?: number;
  sow_count?: number;
  provisioned_at?: string;
  provisionedAt?: string;
  msa_ref?: string;
  msaRef?: string;
  region?: string;
  currency?: string;
  payouts_30d?: string;
  payouts30d?: string;
  last_hris_sync_at?: string | null;
  lastHrisSyncAt?: string | null;
}

function mapTenant(r: RawTenant): MockTenant {
  return {
    id: r.id,
    name: r.name,
    domain: r.domain ?? "",
    tier: (r.tier as MockTenant["tier"]) ?? "Pilot",
    status: (r.status as MockTenant["status"]) ?? "active",
    users: r.users ?? r.user_count ?? 0,
    sows: r.sows ?? r.sow_count ?? 0,
    provisionedAt: r.provisioned_at ?? r.provisionedAt ?? new Date().toISOString(),
    msaRef: r.msa_ref ?? r.msaRef ?? "—",
    region: r.region ?? "—",
    currency: r.currency ?? "INR",
    payouts30d: r.payouts_30d ?? r.payouts30d,
    lastHrisSyncAt: r.last_hris_sync_at ?? r.lastHrisSyncAt ?? null,
  };
}

export async function fetchAdminTenants(): Promise<MockTenant[]> {
  const res = await fetch("/api/superadmin/tenants", {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch tenants (${res.status})`);
  }
  const data = (await res.json()) as { items?: RawTenant[] } | RawTenant[];
  const items = Array.isArray(data) ? data : (data.items ?? []);
  return items.map(mapTenant);
}

interface RawTenantUser {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  status?: string;
  last_seen?: string;
  lastSeen?: string;
}

function mapTenantUser(u: RawTenantUser, idx: number): TenantUserRow {
  return {
    id: u.id ?? `u-${idx}`,
    email: u.email ?? "",
    name: u.name ?? u.email ?? "Unknown",
    role: u.role ?? "ent.user",
    status: (u.status as TenantUserRow["status"]) ?? "active",
    lastSeen: u.last_seen ?? u.lastSeen,
  };
}

export interface AdminTenantDetail {
  tenant: MockTenant;
  users: TenantUserRow[];
}

export async function fetchAdminTenant(tenantId: string): Promise<AdminTenantDetail | null> {
  const res = await fetch(`/api/superadmin/tenants/${tenantId}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to fetch tenant ${tenantId} (${res.status})`);
  }
  const data = (await res.json()) as {
    tenant?: RawTenant;
    users?: RawTenantUser[];
  } | RawTenant;

  let raw: RawTenant;
  let rawUsers: RawTenantUser[] = [];

  if ("tenant" in data && data.tenant) {
    raw = data.tenant;
    rawUsers = (data as { tenant: RawTenant; users?: RawTenantUser[] }).users ?? [];
  } else {
    raw = data as RawTenant;
  }

  if (!raw?.id) return null;
  return {
    tenant: mapTenant(raw),
    users: rawUsers.map(mapTenantUser),
  };
}

// ── User provisioning ─────────────────────────────────────────────────────

export interface CreateSuperadminUserInput {
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  [key: string]: unknown;
}

export async function createSuperadminUser(
  input: CreateSuperadminUserInput,
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  const res = await fetch("/api/superadmin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err =
      typeof data.error === "string"
        ? data.error
        : "Failed to create user";
    return { ok: false, error: err };
  }
  return { ok: true, data };
}
