/**
 * Mock-backend client for the contributor portal.
 *
 * Pages call functions here instead of importing from `@/mocks/contributor`
 * directly. That way the wire shape is identical to what the real Glimmora
 * backend will return — we can swap one route at a time later without
 * touching components.
 */

import type { MockCredential } from "@/mocks/contributor/credentials";
import type { MockPayout, MockPayoutMethod } from "@/mocks/contributor/payouts";
import type { MockTask } from "@/mocks/contributor/tasks";
import type { MockSubmission } from "@/mocks/contributor/submissions";
import type { FaqGroup, MockGrievance, MockSafetyCase, MockTicket } from "@/mocks/contributor/support";
import type { PersonaProfile } from "@/mocks/contributor/personas";
import type { MockSkill, MockDigitalTwin } from "@/mocks/contributor/digital-twin";

const BASE = "/api/mock/contributor";

export class ContributorApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ContributorApiError";
  }
}

async function getJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, cache: "no-store" });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) msg = body.error;
    } catch { /* ignore */ }
    throw new ContributorApiError(res.status, msg);
  }
  return (await res.json()) as T;
}

// ── Credentials ─────────────────────────────────────────────────────────

export interface CredentialListResponse {
  items: MockCredential[];
  total: number;
}

export interface CredentialDetailResponse {
  credential: MockCredential;
}

export function fetchCredentials(signal?: AbortSignal): Promise<CredentialListResponse> {
  return getJSON<CredentialListResponse>("/credentials", { signal });
}

export function fetchCredential(id: string, signal?: AbortSignal): Promise<CredentialDetailResponse> {
  return getJSON<CredentialDetailResponse>(`/credentials/${encodeURIComponent(id)}`, { signal });
}

// ── Earnings & payouts ──────────────────────────────────────────────────

export interface EarningsSummaryResponse {
  withdrawableMinor: number;
  kpis: { thisWeekMinor: number; thisMonthMinor: number; allTimeMinor: number };
  pending: MockPayout[];
  recent: MockPayout[];
}

export interface PayoutListResponse {
  items: Array<MockPayout & { project: string }>;
  total: number;
  page: number;
  limit: number;
}

export interface PayoutMethodListResponse {
  items: MockPayoutMethod[];
  total: number;
}

export function fetchEarningsSummary(signal?: AbortSignal): Promise<EarningsSummaryResponse> {
  return getJSON<EarningsSummaryResponse>("/earnings/summary", { signal });
}

export function fetchPayouts(opts: { page?: number; limit?: number } = {}, signal?: AbortSignal): Promise<PayoutListResponse> {
  const q = new URLSearchParams();
  if (opts.page) q.set("page", String(opts.page));
  if (opts.limit) q.set("limit", String(opts.limit));
  const qs = q.toString();
  return getJSON<PayoutListResponse>(`/payouts${qs ? `?${qs}` : ""}`, { signal });
}

export function fetchPayoutMethods(signal?: AbortSignal): Promise<PayoutMethodListResponse> {
  return getJSON<PayoutMethodListResponse>("/payout-methods", { signal });
}

// ── Tasks ───────────────────────────────────────────────────────────────

export interface TaskListResponse {
  items: MockTask[];
  total: number;
}

export interface TaskDetailResponse {
  task: MockTask;
  submission: MockSubmission | null;
}

export function fetchTasks(
  opts: { status?: string | string[] } = {},
  signal?: AbortSignal,
): Promise<TaskListResponse> {
  const q = new URLSearchParams();
  if (opts.status) q.set("status", Array.isArray(opts.status) ? opts.status.join(",") : opts.status);
  const qs = q.toString();
  return getJSON<TaskListResponse>(`/tasks${qs ? `?${qs}` : ""}`, { signal });
}

export function fetchTask(id: string, signal?: AbortSignal): Promise<TaskDetailResponse> {
  return getJSON<TaskDetailResponse>(`/tasks/${encodeURIComponent(id)}`, { signal });
}

// ── Completed tasks (joined with payout + credential) ──────────────────

export interface CompletedRow {
  task: MockTask;
  payoutMinor: number;
  payoutStatus: string;
  credentialId?: string;
}

export interface CompletedTaskListResponse {
  items: CompletedRow[];
  total: number;
  totalEarnedMinor: number;
}

export function fetchCompletedTasks(signal?: AbortSignal): Promise<CompletedTaskListResponse> {
  return getJSON<CompletedTaskListResponse>("/tasks/completed", { signal });
}

// ── Revisions queue (joined with latest submission) ────────────────────

export interface RevisionRow {
  task: MockTask;
  submission: MockSubmission;
  readyToResubmit: boolean;
  correctionsTotal: number;
  correctionsAddressed: number;
}

export interface RevisionListResponse {
  items: RevisionRow[];
  total: number;
}

export function fetchRevisions(signal?: AbortSignal): Promise<RevisionListResponse> {
  return getJSON<RevisionListResponse>("/tasks/revisions", { signal });
}

export interface CompletedTaskDetailResponse {
  task: MockTask;
  submission: MockSubmission | null;
  payout: MockPayout | null;
  credential: MockCredential | null;
}

export function fetchCompletedTask(id: string, signal?: AbortSignal): Promise<CompletedTaskDetailResponse> {
  return getJSON<CompletedTaskDetailResponse>(`/tasks/completed/${encodeURIComponent(id)}`, { signal });
}

// ── Support ────────────────────────────────────────────────────────────

export interface SupportIndexResponse {
  faqs: FaqGroup[];
  tickets: MockTicket[];
  safetyCases: MockSafetyCase[];
  grievances: MockGrievance[];
}

export interface TicketDetailResponse {
  ticket: MockTicket;
}

export interface SafetyCaseDetailResponse {
  safetyCase: MockSafetyCase;
}

export interface GrievanceDetailResponse {
  grievance: MockGrievance;
}

export function fetchSupportIndex(signal?: AbortSignal): Promise<SupportIndexResponse> {
  return getJSON<SupportIndexResponse>("/support/index", { signal });
}

export function fetchTicket(id: string, signal?: AbortSignal): Promise<TicketDetailResponse> {
  return getJSON<TicketDetailResponse>(`/tickets/${encodeURIComponent(id)}`, { signal });
}

export function fetchSafetyCase(id: string, signal?: AbortSignal): Promise<SafetyCaseDetailResponse> {
  return getJSON<SafetyCaseDetailResponse>(`/safety-cases/${encodeURIComponent(id)}`, { signal });
}

export function fetchGrievance(id: string, signal?: AbortSignal): Promise<GrievanceDetailResponse> {
  return getJSON<GrievanceDetailResponse>(`/grievances/${encodeURIComponent(id)}`, { signal });
}

// ── Profile / skills / digital twin ────────────────────────────────────

export interface MeResponse { profile: PersonaProfile }
export interface SkillListResponse { items: MockSkill[]; total: number }
export interface SkillDetailResponse {
  skill: MockSkill;
  tasksUsingSkill: MockTask[];
  credentialsForSkill: MockCredential[];
}
export interface DigitalTwinResponse { twin: MockDigitalTwin }

function personaQuery(persona?: string): string {
  return persona ? `?persona=${encodeURIComponent(persona)}` : "";
}

export function fetchMe(persona?: string, signal?: AbortSignal): Promise<MeResponse> {
  return getJSON<MeResponse>(`/me${personaQuery(persona)}`, { signal });
}

export function fetchSkills(signal?: AbortSignal): Promise<SkillListResponse> {
  return getJSON<SkillListResponse>("/skills", { signal });
}

export function fetchSkill(id: string, signal?: AbortSignal): Promise<SkillDetailResponse> {
  return getJSON<SkillDetailResponse>(`/skills/${encodeURIComponent(id)}`, { signal });
}

export function fetchDigitalTwin(persona?: string, signal?: AbortSignal): Promise<DigitalTwinResponse> {
  return getJSON<DigitalTwinResponse>(`/digital-twin${personaQuery(persona)}`, { signal });
}
