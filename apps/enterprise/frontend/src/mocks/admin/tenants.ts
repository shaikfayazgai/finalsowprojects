/**
 * Admin · tenants mock — spec doc 04 §5.C.
 */

export type TenantStatus = "active" | "provisioning" | "paused" | "draft" | "closed";

export interface MockTenant {
  id: string;
  name: string;
  domain: string;
  tier: "Enterprise" | "Growth" | "Pilot" | "Trial";
  status: TenantStatus;
  users: number;
  sows: number;
  provisionedAt: string;     // ISO
  msaRef: string;
  region: string;
  currency: string;
  payouts30d?: string;       // formatted
  lastHrisSyncAt?: string | null;
}

export interface ProvisioningStep {
  id: string;
  label: string;
  state: "done" | "pending" | "failed";
  at?: string;
}

export interface TenantUserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  status: "active" | "invited" | "suspended";
  lastSeen?: string;
}

export const MOCK_TENANTS: MockTenant[] = [];

export const MOCK_PROVISIONING_STEPS: Record<string, ProvisioningStep[]> = {};

export const MOCK_TENANT_USERS: Record<string, TenantUserRow[]> = {};
