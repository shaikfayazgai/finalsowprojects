/**
 * Contributor payouts + credentials client (UI1f).
 *
 * Wraps the M17a/b/c payout endpoints + the M18 credentials endpoints
 * I just added in this milestone. All read-own; mutations are
 * payout-method management + withdrawal request.
 */

import type { CredentialDetail } from "@/lib/credentials/types";
import type { PayoutDetail, PayoutMethodDetail, PayoutStatus } from "@/lib/payouts/types";
import type { MockCredential } from "@/mocks/contributor/credentials";
import {
  getDemoPayoutMethods,
  listDemoPayoutsForEmail,
  requestDemoPayoutWithdrawal,
} from "@/lib/enterprise/mocks/demo-payout-bridge";

export class PayoutsApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public reason?: string,
  ) {
    super(message);
    this.name = "PayoutsApiError";
  }
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "same-origin",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let body: { error?: string; code?: string; reason?: string } = {};
    try {
      body = await res.json();
    } catch {
      /* noop */
    }
    throw new PayoutsApiError(
      body.error ?? res.statusText,
      res.status,
      body.code,
      body.reason,
    );
  }
  return (await res.json()) as T;
}

/* ───────────────────────── Payouts ───────────────────────── */

/**
 * The backend payouts table returns snake_case rows ({task_id, amount_minor,
 * eligible_at, data:{grossMinor,netMinor,gstPct,submissionId}}). The UI consumes
 * the camelCase PayoutDetail shape (taskDefinitionId, computation, amountMinor…).
 * Map defensively so missing fields never crash the earnings views, and accept
 * rows that are already PayoutDetail-shaped (camelCase) unchanged.
 */
function toPayoutDetail(r: Record<string, unknown>): PayoutDetail {
  const g = <T,>(...keys: string[]): T | undefined => {
    for (const k of keys) if (r[k] != null) return r[k] as T;
    return undefined;
  };
  const data = (typeof r.data === "object" && r.data ? r.data : {}) as Record<string, unknown>;
  const amountMinor = Number(g<number | string>("amount_minor", "amountMinor") ?? 0) || 0;
  const currency = String(g<string>("currency") ?? "INR");
  // Map the 3-party payout status → the UI's PayoutStatus taxonomy. The backend
  // `payouts` table uses paid/released/requested; the earnings views count "sent"
  // as paid and "processing" as in-transit, so without this map paid rows never
  // register (All-time-paid shows ₹0 despite SIM-settled payouts).
  const STATUS_MAP: Record<string, PayoutStatus> = {
    paid: "sent", released: "processing", requested: "requested",
    eligible: "eligible", failed: "failed", reversed: "failed",
  };
  const rawStatus = String(g<string>("status") ?? "eligible");
  const status = (STATUS_MAP[rawStatus] ?? rawStatus) as PayoutStatus;
  const taskId = g<string | number>("task_id", "taskDefinitionId");
  return {
    id: String(g<string | number>("id") ?? ""),
    contributorId: String(g<string | number>("account_id", "contributorId") ?? ""),
    taskDefinitionId: taskId != null ? String(taskId) : "",
    taskTitle: g<string>("task_title", "taskTitle"),
    submissionId: String(data.submissionId ?? g<string>("submission_id", "submissionId") ?? ""),
    tenantId: String(g<string>("tenant_id", "tenantId") ?? data.tenantId ?? ""),
    amountMinor,
    currency,
    computation: {
      currency,
      ratePerHour: Number(data.ratePerHour ?? 0) || 0,
      hoursBilled: Number(data.hoursBilled ?? 0) || 0,
      amountMinor,
      minorMultiplier: 100,
      notes: typeof data.source === "string" ? data.source : undefined,
    },
    status,
    payoutMethodId: (g<string>("method_id", "payoutMethodId") ?? null) as string | null,
    externalRef: (g<string>("external_ref", "externalRef") ?? null) as string | null,
    failureReason: (g<string>("failure_reason", "failureReason") ?? null) as string | null,
    eligibleAt: String(g<string>("eligible_at", "eligibleAt", "created_at", "createdAt") ?? ""),
    requestedAt: (g<string>("requested_at", "requestedAt") ?? null) as string | null,
    processingAt: (g<string>("processing_at", "processingAt") ?? null) as string | null,
    sentAt: (g<string>("paid_at", "sentAt", "sent_at") ?? null) as string | null,
    failedAt: (g<string>("failed_at", "failedAt") ?? null) as string | null,
    onHoldAt: (g<string>("on_hold_at", "onHoldAt") ?? null) as string | null,
    createdAt: String(g<string>("created_at", "createdAt") ?? ""),
    updatedAt: String(g<string>("updated_at", "updatedAt", "created_at", "createdAt") ?? ""),
  };
}

function mergeDemoPayouts(
  items: PayoutDetail[],
  email: string | null | undefined,
): PayoutDetail[] {
  if (typeof window === "undefined" || !email) return items;
  const demos = listDemoPayoutsForEmail(email);
  const byId = new Map(items.map((p) => [p.id, p]));
  for (const d of demos) byId.set(d.id, d);
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function listMyPayouts(
  params: { status?: string | string[]; contributorEmail?: string | null } = {},
) {
  const q = new URLSearchParams();
  if (params.status) {
    const arr = Array.isArray(params.status) ? params.status : [params.status];
    arr.forEach((s) => q.append("status", s));
  }
  let items: PayoutDetail[] = [];
  try {
    const res = await fetchJson<{ payouts?: unknown[]; items?: unknown[] }>(
      `/api/payouts?${q.toString()}`,
    );
    const raw = (res.items ?? res.payouts ?? []) as Record<string, unknown>[];
    items = raw.map(toPayoutDetail);
  } catch (err) {
    if (
      !(err instanceof PayoutsApiError) ||
      (err.status !== 401 && err.status < 500)
    ) {
      throw err;
    }
  }
  return { items: mergeDemoPayouts(items, params.contributorEmail) };
}

export async function requestPayoutWithdrawal(
  payoutId: string,
  payoutMethodId?: string,
): Promise<{ payout: PayoutDetail }> {
  const demo = typeof window !== "undefined" ? requestDemoPayoutWithdrawal(payoutId) : undefined;
  if (demo) return { payout: demo };
  return fetchJson(`/api/payouts/${payoutId}/request`, {
    method: "POST",
    body: JSON.stringify(payoutMethodId ? { payoutMethodId } : {}),
  });
}

export async function listMyPayoutMethods(): Promise<{ items: PayoutMethodDetail[] }> {
  try {
    return await fetchJson(`/api/payouts/methods`);
  } catch (err) {
    if (
      err instanceof PayoutsApiError &&
      (err.status === 401 || err.status >= 500)
    ) {
      return { items: [] };
    }
    throw err;
  }
}

export async function listMyPayoutMethodsWithDemo(
  contributorEmail?: string | null,
): Promise<{ items: PayoutMethodDetail[] }> {
  try {
    const res = await listMyPayoutMethods();
    if (res.items.length > 0) return res;
  } catch {
    /* fall through to demo */
  }
  if (typeof window !== "undefined" && contributorEmail) {
    return { items: getDemoPayoutMethods(contributorEmail) };
  }
  return { items: [] };
}

export async function createMyPayoutMethod(input: {
  kind: "bank_in" | "upi" | "paypal" | "razorpay_x";
  nickname?: string;
  payload: Record<string, unknown>;
  setDefault?: boolean;
}): Promise<{ method: PayoutMethodDetail }> {
  return fetchJson(`/api/payouts/methods`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function setDefaultMyPayoutMethod(
  methodId: string,
): Promise<{ method: PayoutMethodDetail }> {
  return fetchJson(`/api/payouts/methods/${methodId}`, {
    method: "PATCH",
    body: JSON.stringify({ setDefault: true }),
  });
}

export async function deleteMyPayoutMethod(methodId: string): Promise<{ deleted: true }> {
  return fetchJson(`/api/payouts/methods/${methodId}`, { method: "DELETE" });
}

/* ───────────────────────── Credentials ───────────────────────── */

function credentialToCard(c: CredentialDetail): MockCredential {
  const skill = c.skills[0] ?? c.content.skills[0] ?? "Skill";
  return {
    id: c.id,
    shareId: c.shareSlug,
    taskId: c.taskDefinitionId,
    skill,
    level: "L3",
    taskTitle: c.content.taskTitle,
    description: c.summary ?? `Verified delivery for ${c.content.taskTitle}`,
    project: c.content.tenantName,
    issuedAt: c.issuedAt,
    verifierName: "Glimmora verifier",
    verifierOrg: c.content.tenantName,
  };
}

/**
 * Map a raw contributor_credentials backend row → the FE CredentialDetail.
 * Rich fields (taskTitle, tenantName, skills, signature…) live in the row's
 * `data` JSONB; scalar columns (id/status/issued_at/title) sit alongside.
 */
function mapRawCredential(raw: Record<string, unknown>): CredentialDetail {
  const d = (raw.data && typeof raw.data === "object" ? raw.data : {}) as Record<string, unknown>;
  const str = (v: unknown, fallback = ""): string => (v == null ? fallback : String(v));
  const skills = Array.isArray(d.skills) ? d.skills.map((s) => String(s)) : [];
  const id = str(raw.id);
  const issuedAt = str(raw.issued_at ?? d.issuedAt);
  return {
    id,
    contributorId: str(d.contributorId),
    taskDefinitionId: str(d.taskDefinitionId ?? d.taskId),
    submissionId: str(d.submissionId),
    tenantId: str(d.tenantId),
    status: raw.status === "revoked" ? "revoked" : "issued",
    shareSlug: str(d.shareSlug ?? d.shareId ?? raw.verification_code),
    content: {
      v: 1,
      credentialId: id,
      contributorId: str(d.contributorId),
      contributorName: str(d.contributorName),
      tenantId: str(d.tenantId),
      tenantName: str(d.tenantName ?? raw.issuer, "Glimmora"),
      taskTitle: str(d.taskTitle ?? raw.title),
      taskExternalKey: d.taskExternalKey ? str(d.taskExternalKey) : undefined,
      skills,
      acceptedAt: str(d.acceptedAt ?? issuedAt),
      issuedAt,
      mentorReviewedBy: d.mentorReviewedBy ? str(d.mentorReviewedBy) : undefined,
    },
    signature: str(d.signature),
    signingKeyVersion: Number(d.signingKeyVersion ?? 1),
    summary: d.summary != null ? str(d.summary) : str(raw.title) || null,
    skills,
    issuedAt,
    revokedAt: d.revokedAt != null ? str(d.revokedAt) : null,
    revokedBy: d.revokedBy != null ? str(d.revokedBy) : null,
    revokedReason: d.revokedReason != null ? str(d.revokedReason) : null,
    createdAt: issuedAt,
    updatedAt: issuedAt,
  };
}

export async function listMyCredentials(
  params: { status?: "issued" | "revoked" } = {},
): Promise<{ items: CredentialDetail[] }> {
  const q = new URLSearchParams();
  if (params.status) q.set("status", params.status);
  const res = await fetchJson<{ items?: Record<string, unknown>[] }>(
    `/api/contributor/credentials?${q.toString()}`,
  );
  let items = (res.items ?? []).map(mapRawCredential);
  if (params.status) items = items.filter((c) => c.status === params.status);
  return { items };
}

export async function getMyCredential(credentialId: string): Promise<{ credential: CredentialDetail }> {
  const raw = await fetchJson<Record<string, unknown>>(`/api/contributor/credentials/${credentialId}`);
  return { credential: mapRawCredential(raw) };
}

export async function listMyCredentialsWithFallback(
  params: { status?: "issued" | "revoked" } = {},
): Promise<{ items: MockCredential[] }> {
  const res = await listMyCredentials(params);
  return { items: res.items.map(credentialToCard) };
}

export async function getMyCredentialWithFallback(
  credentialId: string,
): Promise<{ credential: MockCredential }> {
  const res = await getMyCredential(credentialId);
  return { credential: credentialToCard(res.credential) };
}
