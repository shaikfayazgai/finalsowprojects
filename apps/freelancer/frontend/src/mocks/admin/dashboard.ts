/**
 * Admin · dashboard aggregate mock — spec doc 04 §5.B.
 */

export type AdminAttentionKind = "governance" | "kyc" | "rail" | "system";

export interface MockAdminAttentionItem {
  id: string;
  kind: AdminAttentionKind;
  title: string;
  entity: string;
  href: string;
  slaHours?: number;
}

export interface MockAdminDashboard {
  env: "PROD" | "STAGING" | "DEV";
  greetingFor: string;
  kpis: {
    servicesUp: number;
    servicesTotal: number;
    tenants: number;
    mentors: number;
    activeSows: number;
  };
  pipeline: {
    tenantsActive: number;
    commercialGate: number;
    governanceOpen: number;
    kycPending: number;
    mentorsActive: number;
  };
  actionBreakdown: {
    resolved30d: number;
    escalated: number;
    onHold: number;
  };
  attention: MockAdminAttentionItem[];
  recent: { at: string; text: string; kind: "tenant" | "mentor" | "ai" | "skill" | "rail" }[];
  aiSignals: { id: string; tone: "positive" | "neutral" | "warning"; title: string; description: string; href: string }[];
}

// Emptied: no real admin-dashboard aggregate endpoint yet, so end users see a
// clean "all caught up" / empty state instead of fabricated platform metrics.
// Shape/types preserved for when the aggregate API lands.
export const MOCK_ADMIN_DASHBOARD: MockAdminDashboard = {
  env: "PROD",
  greetingFor: "",
  kpis: { servicesUp: 0, servicesTotal: 0, tenants: 0, mentors: 0, activeSows: 0 },
  pipeline: {
    tenantsActive: 0,
    commercialGate: 0,
    governanceOpen: 0,
    kycPending: 0,
    mentorsActive: 0,
  },
  actionBreakdown: { resolved30d: 0, escalated: 0, onHold: 0 },
  attention: [],
  recent: [],
  aiSignals: [],
};

/** Which attention kinds each admin role should see on the dashboard. */
export const ADMIN_ATTENTION_VISIBILITY: Record<AdminAttentionKind, string[]> = {
  governance: ["plat.admin", "plat.tns", "plat.tsm", "plat.mpm", "plat.compliance", "plat.partnerships"],
  kyc: ["plat.admin", "plat.tns", "plat.compliance", "plat.partnerships"],
  rail: ["plat.admin", "plat.payments", "plat.compliance"],
  system: ["plat.admin", "plat.tsm", "plat.ai", "plat.payments"],
};
