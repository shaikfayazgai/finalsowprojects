/**
 * Spec-shaped settings mock — used until backend endpoints ship.
 */

export interface TenantInfoMock {
  name: string;
  tenantId: string;
  domain: string;
  domainVerified: boolean;
  subscription: string;
  renewsAt: string;
}

export interface TenantMemberMock {
  id: string;
  name: string;
  email: string;
  roles: string[];
  status: "active" | "invited" | "suspended";
  invitedAt?: string | null;
  lastActiveAt?: string | null;
  suspendedAt?: string | null;
}

export interface IntegrationMock {
  id: string;
  category: string;
  name: string;
  description: string;
  connected: boolean;
  connectedDetail?: string;
  lastSyncAt?: string | null;
}

export interface SlaTemplateMock {
  workType: string;
  intakeDays: number;
  decompDays: number;
  reviewDays: number;
  acceptDays: number;
  totalDays: number;
}

export interface GovernanceThresholdMock {
  minAiConfidencePct: number;
  minMentorStars: number;
  auditRetention: string;
  consentExpiry: string;
}

export function getTenantInfoMock(): TenantInfoMock {
  return {
    name: "Glimmora HQ",
    tenantId: "glimmora-hq",
    domain: "glimmora.ai",
    domainVerified: true,
    subscription: "Enterprise",
    renewsAt: "2026-12-31T00:00:00Z",
  };
}

export function getTenantMembersMock(): TenantMemberMock[] {
  return [
    {
      // The dev/demo session signs in as admin@glimmora.ai. Give that identity
      // an explicit enterprise Admin membership so approval actions (approve /
      // send-back / reject) are reachable in the demo — without this it falls
      // back to a read-only "sponsor" and no decision controls render.
      id: "u0",
      name: "Aishwarya Rao",
      email: "admin@glimmora.ai",
      roles: ["admin"],
      status: "active",
      lastActiveAt: "2026-06-06T09:00:00Z",
    },
    {
      id: "u1",
      name: "Sandeep Kumar",
      email: "sandeep@glimmora.ai",
      roles: ["sponsor"],
      status: "active",
      lastActiveAt: "2026-05-27T09:15:00Z",
    },
    {
      id: "u2",
      name: "Anjali Reddy",
      email: "anjali@glimmora.ai",
      roles: ["pmo", "admin"],
      status: "active",
      lastActiveAt: "2026-05-28T08:42:00Z",
    },
    {
      id: "u3",
      name: "Karthik Iyer",
      email: "karthik@glimmora.ai",
      roles: ["reviewer", "it"],
      status: "active",
      lastActiveAt: "2026-05-26T14:20:00Z",
    },
    {
      id: "u4",
      name: "Priya Nair",
      email: "priya@glimmora.ai",
      roles: ["finance", "compliance"],
      status: "active",
      lastActiveAt: "2026-05-25T11:05:00Z",
    },
    {
      id: "u5",
      name: "Lakshmi M.",
      email: "lakshmi@glimmora.ai",
      roles: ["pmo"],
      status: "invited",
      invitedAt: "2026-05-20T10:00:00Z",
    },
    {
      id: "u6",
      name: "Rohit Menon",
      email: "rohit@glimmora.ai",
      roles: ["procurement"],
      status: "active",
      lastActiveAt: "2026-05-24T16:30:00Z",
    },
    {
      id: "u7",
      name: "Vikram Desai",
      email: "vikram@glimmora.ai",
      roles: ["finance", "procurement"],
      status: "active",
      lastActiveAt: "2026-05-22T09:00:00Z",
    },
    {
      id: "u8",
      name: "Deepa Rao",
      email: "deepa@glimmora.ai",
      roles: ["reviewer"],
      status: "suspended",
      lastActiveAt: "2026-04-10T08:00:00Z",
      suspendedAt: "2026-05-01T12:00:00Z",
    },
    {
      id: "u-acme-sponsor",
      name: "Sandeep Kulkarni",
      email: "sandeep@acme.com",
      roles: ["sponsor"],
      status: "active",
      lastActiveAt: new Date().toISOString(),
    },
    {
      id: "u-acme-admin",
      name: "Anjali Rao",
      email: "anjali@acme.com",
      roles: ["admin"],
      status: "active",
      lastActiveAt: new Date().toISOString(),
    },
    {
      id: "u-acme-pmo",
      name: "Rahul Desai",
      email: "rahul@acme.com",
      roles: ["pmo"],
      status: "active",
      lastActiveAt: new Date().toISOString(),
    },
    {
      id: "u-acme-finance",
      name: "Vikram Patel",
      email: "vikram@acme.com",
      roles: ["finance"],
      status: "active",
      lastActiveAt: new Date().toISOString(),
    },
    {
      id: "u-acme-legal",
      name: "Meera Joshi",
      email: "meera@acme.com",
      roles: ["compliance"],
      status: "active",
      lastActiveAt: new Date().toISOString(),
    },
    {
      id: "u-acme-security",
      name: "Rohit Banerjee",
      email: "rohit@acme.com",
      roles: ["it"],
      status: "active",
      lastActiveAt: new Date().toISOString(),
    },
  ];
}

export function computeTenantSummary(members: TenantMemberMock[]) {
  const active = members.filter((m) => m.status === "active").length;
  const invited = members.filter((m) => m.status === "invited").length;
  const suspended = members.filter((m) => m.status === "suspended").length;
  const roleSet = new Set(members.flatMap((m) => m.roles));
  return {
    total: members.length,
    active,
    invited,
    suspended,
    rolesInUse: roleSet.size,
  };
}

export function getIntegrationsMock(): IntegrationMock[] {
  return [
    {
      id: "sso",
      category: "Identity & access",
      name: "SSO (SAML / OIDC)",
      description: "Single sign-on via your enterprise identity provider.",
      connected: true,
      connectedDetail: "Connected to Glimmora Azure AD",
      lastSyncAt: "2026-05-28T06:00:00Z",
    },
    {
      id: "webhooks",
      category: "Project tools",
      name: "Webhooks (Jira / Azure DevOps / generic)",
      description: "Push project events to external tooling.",
      connected: true,
      connectedDetail: "3 webhooks active",
      lastSyncAt: "2026-05-28T11:22:00Z",
    },
    {
      id: "erp",
      category: "Finance & procurement",
      name: "ERP (basic)",
      description: "Push invoices and payouts to your ERP / procurement.",
      connected: false,
    },
  ];
}

export function getIntegrationById(id: string): IntegrationMock | undefined {
  return getIntegrationsMock().find((item) => item.id === id);
}

export interface WebhookMock {
  id: string;
  event: string;
  url: string;
  enabled: boolean;
  lastDeliveryAt?: string | null;
  lastStatus?: "success" | "failed" | null;
}

export function getWebhooksMock(): WebhookMock[] {
  return [
    {
      id: "wh1",
      event: "task.completed",
      url: "https://jira.glimmora.ai/hooks/glimmora",
      enabled: true,
      lastDeliveryAt: "2026-05-28T10:15:00Z",
      lastStatus: "success",
    },
    {
      id: "wh2",
      event: "task.created",
      url: "https://jira.glimmora.ai/hooks/glimmora",
      enabled: true,
      lastDeliveryAt: "2026-05-28T09:42:00Z",
      lastStatus: "success",
    },
    {
      id: "wh3",
      event: "project.health.changed",
      url: "https://hooks.slack.com/services/T1/B2/abc",
      enabled: true,
      lastDeliveryAt: "2026-05-27T18:00:00Z",
      lastStatus: "success",
    },
  ];
}

export function computeIntegrationsSummary(integrations: IntegrationMock[]) {
  const connected = integrations.filter((i) => i.connected).length;
  return {
    total: integrations.length,
    connected,
    available: integrations.length - connected,
    categories: new Set(integrations.map((i) => i.category)).size,
  };
}

export interface EscalationRuleMock {
  id: string;
  offset: string;
  label: string;
  detail: string;
}

export function getEscalationRulesMock(): EscalationRuleMock[] {
  return [
    { id: "e1", offset: "0h", label: "SLA breach", detail: "PMO + sponsor notified" },
    { id: "e2", offset: "+4h", label: "Still unresolved", detail: "Tenant admin notified" },
    { id: "e3", offset: "+8h", label: "Still unresolved", detail: "Auto-reassign attempt" },
  ];
}

export function computePoliciesSummary(
  slaTemplates: SlaTemplateMock[],
  escalationRules: EscalationRuleMock[],
) {
  return {
    slaTemplates: slaTemplates.length,
    escalationSteps: escalationRules.length,
    governanceRules: 4,
  };
}

export function getSlaTemplatesMock(): SlaTemplateMock[] {
  return [
    {
      workType: "Software project",
      intakeDays: 3,
      decompDays: 5,
      reviewDays: 2,
      acceptDays: 1,
      totalDays: 30,
    },
    {
      workType: "Design system",
      intakeDays: 2,
      decompDays: 3,
      reviewDays: 1,
      acceptDays: 1,
      totalDays: 21,
    },
    {
      workType: "Marketing",
      intakeDays: 1,
      decompDays: 2,
      reviewDays: 1,
      acceptDays: 0.5,
      totalDays: 14,
    },
  ];
}

export function getGovernanceThresholdsMock(): GovernanceThresholdMock {
  return {
    minAiConfidencePct: 70,
    minMentorStars: 4,
    auditRetention: "Indefinite",
    consentExpiry: "Never",
  };
}

export function resolveProfileMember(email?: string | null): TenantMemberMock | null {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  return (
    getTenantMembersMock().find((member) => member.email.toLowerCase() === normalized) ?? null
  );
}

export interface ProfileSummaryMock {
  displayName: string;
  email: string;
  tenantName: string;
  roles: string[];
  memberStatus: TenantMemberMock["status"] | "unknown";
  mfaEnabled: boolean;
  sessionCount: number;
  language: string;
}

export function computeProfileSummary(input: {
  name?: string | null;
  email?: string | null;
  sessionRole?: string;
  mfaEnabled: boolean;
  sessionCount: number;
  language?: string;
}): ProfileSummaryMock {
  const tenant = getTenantInfoMock();
  const member = resolveProfileMember(input.email);
  const roles = member?.roles.length
    ? member.roles
    : input.sessionRole
      ? [input.sessionRole]
      : [];

  return {
    displayName: member?.name ?? input.name ?? "Your profile",
    email: input.email ?? member?.email ?? "—",
    tenantName: tenant.name,
    roles,
    memberStatus: member?.status ?? "unknown",
    mfaEnabled: input.mfaEnabled,
    sessionCount: input.sessionCount,
    language: input.language ?? "English (en-IN)",
  };
}
