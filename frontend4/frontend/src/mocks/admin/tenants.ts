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

export const MOCK_TENANTS: MockTenant[] = [
  { id: "t-acme",     name: "Acme Corp",         domain: "acme.com",     tier: "Enterprise", status: "active",       users: 84, sows: 12, provisionedAt: "2026-01-12T10:00:00Z", msaRef: "MSA-2026-0008", region: "Asia-South · INR",   currency: "INR", payouts30d: "₹14,80,400", lastHrisSyncAt: "2026-05-27T03:45:00Z" },
  { id: "t-helios",   name: "Helios Studios",    domain: "helios.io",    tier: "Enterprise", status: "active",       users: 22, sows: 8,  provisionedAt: "2026-02-04T09:00:00Z", msaRef: "MSA-2026-0014", region: "Americas · USD",     currency: "USD", payouts30d: "$84,200",    lastHrisSyncAt: "2026-05-27T01:10:00Z" },
  { id: "t-northwind", name: "Northwind Logistics", domain: "northwind.co", tier: "Growth", status: "active",       users: 36, sows: 5,  provisionedAt: "2026-03-19T08:30:00Z", msaRef: "MSA-2026-0021", region: "Asia-South · INR",   currency: "INR", payouts30d: "₹6,20,000",  lastHrisSyncAt: "2026-05-26T22:00:00Z" },
  { id: "t-vesta",    name: "Vesta Health",      domain: "vesta.health", tier: "Enterprise", status: "active",       users: 58, sows: 9,  provisionedAt: "2026-02-22T11:00:00Z", msaRef: "MSA-2026-0017", region: "Europe · EUR",       currency: "EUR", payouts30d: "€48,100",    lastHrisSyncAt: "2026-05-27T05:20:00Z" },
  { id: "t-reporting", name: "Reporting Inc.",   domain: "reporting.tv", tier: "Pilot",      status: "provisioning", users: 1,  sows: 0,  provisionedAt: "2026-05-26T12:00:00Z", msaRef: "MSA-2026-0042", region: "Americas · USD",     currency: "USD", lastHrisSyncAt: null },
  { id: "t-kestrel",  name: "Kestrel Aero",      domain: "kestrel.aero", tier: "Pilot",      status: "provisioning", users: 2,  sows: 0,  provisionedAt: "2026-05-25T09:00:00Z", msaRef: "MSA-2026-0040", region: "Europe · EUR",       currency: "EUR", lastHrisSyncAt: null },
  { id: "t-orbit",    name: "Orbit Microfin",    domain: "orbit.fin",    tier: "Growth",     status: "paused",       users: 14, sows: 3,  provisionedAt: "2025-11-08T10:00:00Z", msaRef: "MSA-2025-0309", region: "Asia-South · INR",   currency: "INR", payouts30d: "₹0",         lastHrisSyncAt: "2026-04-12T03:00:00Z" },
];

export const MOCK_PROVISIONING_STEPS: Record<string, ProvisioningStep[]> = {
  "t-acme": [
    { id: "scope",    label: "Tenant scope created",                     state: "done", at: "2026-01-12T10:00:00Z" },
    { id: "policies", label: "Default policies applied",                 state: "done", at: "2026-01-12T10:00:00Z" },
    { id: "admin",    label: "Admin invite sent (sandeep@acme.com)",     state: "done", at: "2026-01-12T10:01:00Z" },
    { id: "signin",   label: "First admin sign-in",                      state: "done", at: "2026-01-12T11:14:00Z" },
    { id: "sow",      label: "First SOW upload",                         state: "done", at: "2026-01-15T08:42:00Z" },
  ],
  "t-reporting": [
    { id: "scope",    label: "Tenant scope created",                     state: "done", at: "2026-05-26T12:00:00Z" },
    { id: "policies", label: "Default policies applied",                 state: "done", at: "2026-05-26T12:00:00Z" },
    { id: "admin",    label: "Admin invite sent (helios@reporting.tv)",  state: "done", at: "2026-05-26T12:01:00Z" },
    { id: "signin",   label: "First admin sign-in",                      state: "pending" },
    { id: "sow",      label: "First SOW upload",                         state: "pending" },
  ],
  "t-kestrel": [
    { id: "scope",    label: "Tenant scope created",                     state: "done", at: "2026-05-25T09:00:00Z" },
    { id: "policies", label: "Default policies applied",                 state: "done", at: "2026-05-25T09:00:00Z" },
    { id: "admin",    label: "Admin invite sent (admin@kestrel.aero)",   state: "done", at: "2026-05-25T09:02:00Z" },
    { id: "signin",   label: "First admin sign-in",                      state: "done", at: "2026-05-25T11:30:00Z" },
    { id: "sow",      label: "First SOW upload",                         state: "pending" },
  ],
};

export const MOCK_TENANT_USERS: Record<string, TenantUserRow[]> = {
  "t-acme": [
    { id: "u1", email: "sandeep@acme.com",  name: "Sandeep Kulkarni", role: "ent.admin",    status: "active", lastSeen: "2026-05-27T05:20:00Z" },
    { id: "u2", email: "meera@acme.com",    name: "Meera Bhat",       role: "ent.sponsor",  status: "active", lastSeen: "2026-05-26T18:00:00Z" },
    { id: "u3", email: "rahul@acme.com",    name: "Rahul Desai",      role: "ent.pmo",      status: "active", lastSeen: "2026-05-27T06:00:00Z" },
    { id: "u4", email: "karthik@acme.com",  name: "Karthik Iyer",     role: "ent.reviewer", status: "active", lastSeen: "2026-05-26T22:10:00Z" },
    { id: "u5", email: "amrita@acme.com",   name: "Amrita Bose",      role: "ent.finance",  status: "invited" },
  ],
  "t-helios": [
    { id: "u1", email: "helios@helios.io",  name: "Helena Bourne",    role: "ent.admin",    status: "active", lastSeen: "2026-05-27T02:00:00Z" },
    { id: "u2", email: "jp@helios.io",      name: "Jean-Paul Marc",   role: "ent.pmo",      status: "active", lastSeen: "2026-05-26T20:00:00Z" },
  ],
  "t-reporting": [
    { id: "u1", email: "helios@reporting.tv", name: "Owen Reeves",    role: "ent.admin",    status: "invited" },
  ],
};
