/**
 * Contributor payouts + credentials client (UI1f).
 *
 * Wraps the M17a/b/c payout endpoints + the M18 credentials endpoints
 * I just added in this milestone. All read-own; mutations are
 * payout-method management + withdrawal request.
 */

import type { CredentialDetail } from "@/lib/credentials/types";
import type { PayoutDetail, PayoutMethodDetail } from "@/lib/payouts/types";
import type { MockCredential } from "@/mocks/contributor/credentials";
import { fetchCredentials } from "@/lib/api/contributor-mock";
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
    const res = await fetchJson<{ payouts: PayoutDetail[] } | { items: PayoutDetail[] }>(
      `/api/payouts?${q.toString()}`,
    );
    items = "items" in res ? res.items : "payouts" in res ? res.payouts : [];
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

export async function listMyCredentials(params: { status?: "issued" | "revoked" } = {}) {
  const q = new URLSearchParams();
  if (params.status) q.set("status", params.status);
  return fetchJson<{ items: CredentialDetail[] }>(`/api/credentials/mine?${q.toString()}`);
}

export async function getMyCredential(credentialId: string): Promise<{ credential: CredentialDetail }> {
  return fetchJson(`/api/credentials/${credentialId}`);
}

export async function listMyCredentialsWithFallback(
  params: { status?: "issued" | "revoked" } = {},
): Promise<{ items: MockCredential[] }> {
  try {
    const res = await listMyCredentials(params);
    if (res.items.length > 0) {
      return { items: res.items.map(credentialToCard) };
    }
  } catch (err) {
    if (
      !(err instanceof PayoutsApiError) ||
      (err.status !== 401 && err.status !== 403 && err.status < 500)
    ) {
      throw err;
    }
  }
  const mock = await fetchCredentials();
  return { items: mock.items };
}

export async function getMyCredentialWithFallback(
  credentialId: string,
): Promise<{ credential: MockCredential }> {
  try {
    const res = await getMyCredential(credentialId);
    return { credential: credentialToCard(res.credential) };
  } catch (err) {
    if (
      !(err instanceof PayoutsApiError) ||
      (err.status !== 401 && err.status !== 403 && err.status !== 404 && err.status < 500)
    ) {
      throw err;
    }
  }
  const { fetchCredential } = await import("@/lib/api/contributor-mock");
  return fetchCredential(credentialId);
}
