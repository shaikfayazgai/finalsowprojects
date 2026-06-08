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
    name: "",
    tenantId: "",
    domain: "",
    domainVerified: false,
    subscription: "",
    renewsAt: "",
  };
}

export function getTenantMembersMock(): TenantMemberMock[] {
  return [];
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
