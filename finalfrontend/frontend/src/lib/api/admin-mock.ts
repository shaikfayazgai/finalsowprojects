/**
 * Mock-backend client for the platform admin portal.
 *
 * Pages call functions here instead of importing from `@/mocks/admin`
 * directly. The shape matches what the real Glimmora backend will return,
 * so individual routes can be swapped to the real backend without
 * touching the components.
 */

import type {
  AdminProfile, AdminRole,
  MockTenant, ProvisioningStep, TenantUserRow,
  MockAdminMentor, MockCompetencyRow,
  MockSkill,
  MockRubricTemplate,
  MockGovCase,
  MockKycCase,
  MockAdminAuditEvent,
  MockAIAgent, MockPromptTemplate,
  MockPaymentRail,
  MockServiceHealth, MockAlertEntry,
  MockWWPartner,
  MockRoleDef,
  MockAdminDashboard,
} from "@/mocks/admin";

const BASE = "/api/mock/admin";

export class AdminApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "AdminApiError";
  }
}

async function getJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, cache: "no-store" });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try { const body = (await res.json()) as { error?: string }; if (body.error) msg = body.error; } catch { /* ignore */ }
    throw new AdminApiError(res.status, msg);
  }
  return (await res.json()) as T;
}

// ── Identity ─────────────────────────────────────────────────────────────

export interface AdminMeResponse { profile: AdminProfile }
export function fetchAdminMe(role?: AdminRole, signal?: AbortSignal): Promise<AdminMeResponse> {
  const qs = role ? `?role=${encodeURIComponent(role)}` : "";
  return getJSON<AdminMeResponse>(`/me${qs}`, { signal });
}

// ── Dashboard ────────────────────────────────────────────────────────────

export function fetchAdminDashboard(signal?: AbortSignal): Promise<MockAdminDashboard> {
  return getJSON<MockAdminDashboard>(`/dashboard`, { signal });
}

// ── Tenants ──────────────────────────────────────────────────────────────

export interface TenantsListResponse { items: MockTenant[]; counts: { all: number; active: number; provisioning: number; paused: number } }
export function fetchTenants(signal?: AbortSignal): Promise<TenantsListResponse> {
  return getJSON<TenantsListResponse>(`/tenants`, { signal });
}

export interface TenantDetailResponse { tenant: MockTenant; users: TenantUserRow[]; provisioning: ProvisioningStep[] }
export function fetchTenant(id: string, signal?: AbortSignal): Promise<TenantDetailResponse> {
  return getJSON<TenantDetailResponse>(`/tenants/${encodeURIComponent(id)}`, { signal });
}

// ── Mentors ──────────────────────────────────────────────────────────────

export interface MentorsListResponse { items: MockAdminMentor[] }
export function fetchAdminMentors(signal?: AbortSignal): Promise<MentorsListResponse> {
  return getJSON<MentorsListResponse>(`/mentors`, { signal });
}

export interface MentorDetailResponse { mentor: MockAdminMentor; competency: MockCompetencyRow[] }
export function fetchAdminMentor(id: string, signal?: AbortSignal): Promise<MentorDetailResponse> {
  return getJSON<MentorDetailResponse>(`/mentors/${encodeURIComponent(id)}`, { signal });
}

// ── Skill taxonomy ───────────────────────────────────────────────────────

export interface SkillsListResponse { items: MockSkill[] }
export function fetchSkills(signal?: AbortSignal): Promise<SkillsListResponse> {
  return getJSON<SkillsListResponse>(`/skill-taxonomy`, { signal });
}

export function fetchSkill(id: string, signal?: AbortSignal): Promise<{ skill: MockSkill }> {
  return getJSON(`/skill-taxonomy/${encodeURIComponent(id)}`, { signal });
}

// ── Rubric templates ─────────────────────────────────────────────────────

export function fetchRubricTemplates(signal?: AbortSignal): Promise<{ items: MockRubricTemplate[] }> {
  return getJSON(`/rubric-templates`, { signal });
}
export function fetchRubricTemplate(id: string, signal?: AbortSignal): Promise<{ template: MockRubricTemplate }> {
  return getJSON(`/rubric-templates/${encodeURIComponent(id)}`, { signal });
}

// ── Governance ───────────────────────────────────────────────────────────

export interface GovListResponse { items: MockGovCase[]; summary: { openAssignedToMe: number; unassigned: number; closedLast30d: number } }
export function fetchGovernanceCases(signal?: AbortSignal): Promise<GovListResponse> {
  return getJSON<GovListResponse>(`/governance`, { signal });
}
export function fetchGovernanceCase(id: string, signal?: AbortSignal): Promise<{ case: MockGovCase }> {
  return getJSON(`/governance/${encodeURIComponent(id)}`, { signal });
}

// ── KYC ──────────────────────────────────────────────────────────────────

export interface KycListResponse { items: MockKycCase[]; summary: { pending: number; approved30d: number; rejected30d: number; reuploaded: number } }
export function fetchKycCases(signal?: AbortSignal): Promise<KycListResponse> {
  return getJSON<KycListResponse>(`/kyc`, { signal });
}
export function fetchKycCase(id: string, signal?: AbortSignal): Promise<{ case: MockKycCase }> {
  return getJSON(`/kyc/${encodeURIComponent(id)}`, { signal });
}

// ── Audit ────────────────────────────────────────────────────────────────

export function fetchAdminAudit(signal?: AbortSignal): Promise<{ events: MockAdminAuditEvent[] }> {
  return getJSON(`/audit`, { signal });
}
export function fetchAdminAuditEvent(id: string, signal?: AbortSignal): Promise<{ event: MockAdminAuditEvent }> {
  return getJSON(`/audit/${encodeURIComponent(id)}`, { signal });
}

// ── AI agents + prompts ──────────────────────────────────────────────────

export function fetchAdminAgents(signal?: AbortSignal): Promise<{ items: MockAIAgent[] }> {
  return getJSON(`/ai`, { signal });
}
export function fetchAdminAgent(id: string, signal?: AbortSignal): Promise<{ agent: MockAIAgent; activePrompt: MockPromptTemplate | null }> {
  return getJSON(`/ai/${encodeURIComponent(id)}`, { signal });
}
export function fetchAdminPrompts(signal?: AbortSignal): Promise<{ items: MockPromptTemplate[]; agents: MockAIAgent[] }> {
  return getJSON(`/ai/prompts`, { signal });
}
export function fetchAdminPrompt(id: string, signal?: AbortSignal): Promise<{ prompt: MockPromptTemplate; agent: MockAIAgent | null }> {
  return getJSON(`/ai/prompts/${encodeURIComponent(id)}`, { signal });
}

// ── Payment rails ────────────────────────────────────────────────────────

export function fetchPaymentRails(signal?: AbortSignal): Promise<{ items: MockPaymentRail[] }> {
  return getJSON(`/payment-rails`, { signal });
}
export function fetchPaymentRail(id: string, signal?: AbortSignal): Promise<{ rail: MockPaymentRail }> {
  return getJSON(`/payment-rails/${encodeURIComponent(id)}`, { signal });
}

// ── System health ────────────────────────────────────────────────────────

export function fetchAdminSystemHealth(signal?: AbortSignal): Promise<{ services: MockServiceHealth[]; alerts: MockAlertEntry[] }> {
  return getJSON(`/system-health`, { signal });
}

// ── Partnerships ─────────────────────────────────────────────────────────

export function fetchWWPartners(signal?: AbortSignal): Promise<{ items: MockWWPartner[] }> {
  return getJSON(`/partnerships/women-workforce`, { signal });
}
export function fetchWWPartner(id: string, signal?: AbortSignal): Promise<{ partner: MockWWPartner }> {
  return getJSON(`/partnerships/women-workforce/${encodeURIComponent(id)}`, { signal });
}

// ── Roles ────────────────────────────────────────────────────────────────

export function fetchAdminRoles(signal?: AbortSignal): Promise<{ items: MockRoleDef[] }> {
  return getJSON(`/roles`, { signal });
}
