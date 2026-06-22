/**
 * Admin · dashboard aggregate mock — spec doc 04 §5.B.
 */

export type AdminAttentionKind = "governance" | "kyc" | "rail" | "system" | "sow";

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
  recent: {
    at: string;
    text: string;
    kind: "tenant" | "mentor" | "ai" | "skill" | "rail" | "sow" | "kyc" | "rubric" | "audit";
  }[];
  aiSignals: { id: string; tone: "positive" | "neutral" | "warning"; title: string; description: string; href: string }[];
}

export const MOCK_ADMIN_DASHBOARD: MockAdminDashboard = {
  env: "PROD",
  greetingFor: "Aishwarya",
  kpis: { servicesUp: 11, servicesTotal: 12, tenants: 7, mentors: 9, activeSows: 47 },
  pipeline: {
    tenantsActive: 7,
    commercialGate: 5,
    governanceOpen: 3,
    kycPending: 1,
    mentorsActive: 9,
  },
  actionBreakdown: { resolved30d: 28, escalated: 1, onHold: 42 },
  attention: [
    // Phase-1 items first (commercial gate is the platform admin's core job).
    {
      id: "att-sow-1",
      kind: "sow",
      title: "5 SOWs awaiting commercial review",
      entity: "Oldest · 6h",
      href: "/admin/sow",
      slaHours: 6,
    },
    {
      id: "att-kyc-1",
      kind: "kyc",
      title: "1 KYC review pending",
      entity: "SLA · 8h remaining",
      href: "/admin/kyc",
      slaHours: 8,
    },
    // Phase-2 items — kept for reversibility; hidden by the phase gate in Phase 1.
    {
      id: "att-gov-1",
      kind: "governance",
      title: "3 governance cases assigned",
      entity: "Oldest · 4h",
      href: "/admin/governance",
      slaHours: 4,
    },
    {
      id: "att-rail-1",
      kind: "rail",
      title: "Razorpay UPI error rate elevated",
      entity: "Last 1h · degraded",
      href: "/admin/payment-rails/rail-rzp-upi",
    },
  ],
  recent: [
    // Phase-1 events
    { at: "2026-05-27T10:10:00Z", text: "SOW 'API redesign — Acme platform v3' approved at the commercial gate", kind: "sow" },
    { at: "2026-05-27T09:30:00Z", text: "Tenant 'Reporting Inc.' provisioning step 3/6 complete", kind: "tenant" },
    { at: "2026-05-27T08:05:00Z", text: "Mentor 'Rajesh Verma' assigned to SOW 'API redesign — Acme platform v3'", kind: "mentor" },
    { at: "2026-05-27T07:40:00Z", text: "Mentor 'Divya Krishnan' invited to Helios pool", kind: "mentor" },
    { at: "2026-05-27T05:20:00Z", text: "KYC review cleared for contributor 'Ananya Rao'", kind: "kyc" },
    { at: "2026-05-26T23:30:00Z", text: "Rubric template 'Accessibility · WCAG 2.2' published", kind: "rubric" },
    // Phase-2 events — hidden by the phase gate in Phase 1.
    { at: "2026-05-27T03:00:00Z", text: "AI prompt 'review-assistant.score-rubric' rolled to v4", kind: "ai" },
    { at: "2026-05-26T22:10:00Z", text: "Skill 'Rust' added (pending review)", kind: "skill" },
    { at: "2026-05-26T18:50:00Z", text: "Razorpay UPI marked degraded", kind: "rail" },
  ],
  aiSignals: [
    // Phase-1 signals
    {
      id: "ai-kyc",
      tone: "positive",
      title: "KYC resolution ahead of target",
      description: "Average resolution this week: 6h (target: 8h).",
      href: "/admin/kyc",
    },
    {
      id: "ai-sow",
      tone: "neutral",
      title: "Commercial gate throughput steady",
      description: "5 SOWs in queue · median time to decision 1.2 days.",
      href: "/admin/sow",
    },
    {
      id: "ai-mentors",
      tone: "positive",
      title: "Mentor coverage healthy",
      description: "9 active mentors · every approved SOW has a mentor assigned.",
      href: "/admin/mentors",
    },
    // Phase-2 signals — hidden by the phase gate in Phase 1.
    {
      id: "ai-gov",
      tone: "warning",
      title: "Governance backlog trending up",
      description: "+2 cases over baseline — review assignment load.",
      href: "/admin/governance",
    },
    {
      id: "ai-review",
      tone: "neutral",
      title: "Review Assistant acceptance rate",
      description: "61% accepted as-is · 28% modified · 11% overridden.",
      href: "/admin/ai",
    },
  ],
};

/** Which attention kinds each admin role should see on the dashboard. */
export const ADMIN_ATTENTION_VISIBILITY: Record<AdminAttentionKind, string[]> = {
  sow: ["plat.admin", "plat.tsm", "plat.payments"],
  governance: ["plat.admin", "plat.tns", "plat.tsm", "plat.mpm", "plat.compliance", "plat.partnerships"],
  kyc: ["plat.admin", "plat.tns", "plat.compliance", "plat.partnerships"],
  rail: ["plat.admin", "plat.payments", "plat.compliance"],
  system: ["plat.admin", "plat.tsm", "plat.ai", "plat.payments"],
};
