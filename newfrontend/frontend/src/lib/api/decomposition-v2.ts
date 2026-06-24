/**
 * Decomposition v2 API client — REAL backend.
 *
 * Proxies through /api/decomposition/plans → the enterprise backend
 * (/api/v1/enterprise/decomposition). Plans persist in the normalized
 * decomp_plans / decomp_milestones / decomp_tasks / decomp_dependencies
 * tables. The backend returns the same camelCase shapes as the FE types,
 * wrapped as { plan } (single) or { items, nextCursor } (list).
 */

import type {
  CreatePlanInput,
  PlanDetail,
  PlanStatus,
  PlanSummary,
  UpdatePlanInput,
} from "@/lib/decomposition/types";

export class DecompositionApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public reason?: string,
    public issues?: unknown,
  ) {
    super(message);
    this.name = "DecompositionApiError";
  }
}

export interface ListPlansParams {
  sowId?: string;
  status?: PlanStatus | PlanStatus[];
  includeArchived?: boolean;
  limit?: number;
  cursor?: string;
}

export interface PlanListResult {
  items: PlanSummary[];
  nextCursor: string | null;
}

const BASE = "/api/decomposition/plans";

/** Coerce any error body shape (string, FastAPI validation array, object) to a readable string. */
function messageFromError(err: unknown, status: number): string {
  const detail = (err as { detail?: unknown })?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const msgs = detail
      .map((d) => (d && typeof d === "object" ? (d as { msg?: string }).msg : String(d)))
      .filter(Boolean);
    if (msgs.length) return msgs.join("; ");
  }
  const message = (err as { message?: unknown })?.message;
  if (typeof message === "string") return message;
  return `Decomposition request failed (${status})`;
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { cache: "no-store", ...init });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new DecompositionApiError(
      messageFromError(err, res.status),
      res.status,
      (err as { code?: string })?.code,
      (err as { reason?: string })?.reason,
      (err as { issues?: unknown })?.issues,
    );
  }
  return res.json() as Promise<T>;
}

export async function listPlans(params: ListPlansParams = {}): Promise<PlanListResult> {
  const qs = new URLSearchParams();
  if (params.sowId) qs.set("sowId", params.sowId);
  if (params.status) {
    const arr = Array.isArray(params.status) ? params.status : [params.status];
    arr.forEach((s) => qs.append("status", s));
  }
  if (params.includeArchived) qs.set("includeArchived", "true");
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.cursor) qs.set("cursor", params.cursor);
  const q = qs.toString();
  const body = await call<{ items?: PlanSummary[]; nextCursor?: string | null }>(`${BASE}${q ? `?${q}` : ""}`);
  return { items: body.items ?? [], nextCursor: body.nextCursor ?? null };
}

export async function getPlan(planId: string): Promise<PlanDetail> {
  const body = await call<{ plan: PlanDetail }>(`${BASE}/${encodeURIComponent(planId)}`);
  return body.plan;
}

export async function createPlan(input: CreatePlanInput): Promise<PlanDetail> {
  const body = await call<{ plan: PlanDetail }>(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return body.plan;
}

export async function updatePlan(planId: string, input: UpdatePlanInput): Promise<PlanDetail> {
  const body = await call<{ plan: PlanDetail }>(`${BASE}/${encodeURIComponent(planId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return body.plan;
}

async function planAction(planId: string, name: "submit" | "activate" | "archive" | "copy"): Promise<PlanDetail> {
  const body = await call<{ plan: PlanDetail }>(`${BASE}/${encodeURIComponent(planId)}/${name}`, { method: "POST" });
  return body.plan;
}

/** Per-task pricing the super admin sets at approval. amountMinor for fixed, rateMinor (hourly rate) for hourly. */
export interface TaskPricing {
  taskId: string;
  payType: "fixed" | "hourly";
  amountMinor?: number;
  rateMinor?: number;
}

/** Super admin prices each task + approves (provisions delivery). submitted → active. */
export async function approvePlan(planId: string, pricing: TaskPricing[] = [], currency = "INR"): Promise<PlanDetail> {
  const body = await call<{ plan: PlanDetail }>(`${BASE}/${encodeURIComponent(planId)}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pricing, currency }),
  });
  return body.plan;
}

/** Super admin edits per-task pay on an already-priced plan (status unchanged). */
export async function repricePlan(planId: string, pricing: TaskPricing[], currency = "INR"): Promise<PlanDetail> {
  const body = await call<{ plan: PlanDetail }>(`${BASE}/${encodeURIComponent(planId)}/reprice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pricing, currency }),
  });
  return body.plan;
}

// ── 3-party payout (Enterprise → Glimmora → Contributor) ─────────────────────
export interface PayoutTask {
  taskId: string;
  title: string | null;
  deliveryStatus: string;       // ready/assigned/in_progress/.../payment_pending/paid
  delivered: boolean;
  payoutStatus: string | null;  // eligible/requested/released/paid/null
  budgetMinor: number;          // client price for this task
  netMinor?: number;            // Glimmora-only
}

export interface PayoutStatus {
  planId: string;
  sowId: string | null;
  totalTasks: number;
  deliveredTasks: number;
  paidTasks: number;
  progressPct: number;
  paymentPhase: "in_progress" | "completed_sow" | "pending_payment" | "payment_completed";
  payoutCounts: Record<string, number>;
  sowBudgetMinor?: number;      // agreed SOW budget (enterprise's own figure)
  budgetMinor: number;          // billed/actual (client price) — safe for enterprise
  contributorNetMinor?: number; // Glimmora-only
  escrow?: SowEscrow;           // pre-funded budget released into Glimmora for this SOW
  tasks: PayoutTask[];
}

/** SOW escrow — budget the enterprise pre-funded; Glimmora draws payouts from it. */
export interface SowEscrow {
  fundedMinor: number;    // total released into escrow by the enterprise
  spentMinor: number;     // drawn down to pay contributors
  remainingMinor: number; // fundedMinor − spentMinor
  currency: string;
}

export async function getPayoutStatus(planId: string): Promise<PayoutStatus> {
  return call<PayoutStatus>(`${BASE}/${encodeURIComponent(planId)}/payout-status`);
}

const jsonPost = (taskId?: string): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(taskId ? { taskId } : {}),
});

/**
 * Glimmora asks the enterprise to release budget. Scope:
 *  - {taskId}      → one task
 *  - {}            → all eligible (full completed amount)
 *  - {amountMinor} → a custom/partial amount (whole eligible tasks up to it).
 */
export async function requestPayout(
  planId: string,
  opts?: { taskId?: string; amountMinor?: number },
): Promise<{ requested: number; status: PayoutStatus }> {
  const body: Record<string, unknown> = {};
  if (opts?.taskId) body.taskId = opts.taskId;
  if (opts?.amountMinor != null) body.amountMinor = opts.amountMinor;
  return call(`${BASE}/${encodeURIComponent(planId)}/request-payout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Enterprise releases (sends) the budget to Glimmora. Omit amountMinor to pay the
 * whole SOW (all delivered tasks); pass amountMinor for a partial/manual release
 * (pays whole tasks up to that amount).
 */
export async function releasePayment(
  planId: string,
  amountMinor?: number,
  comment?: string,
): Promise<{ released: number; budgetMinor: number; status: PayoutStatus }> {
  const body: Record<string, unknown> = {};
  if (amountMinor != null) body.amountMinor = amountMinor;
  if (comment) body.comment = comment;
  return call(`${BASE}/${encodeURIComponent(planId)}/release-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Enterprise pre-funds (releases) its SOW budget to Glimmora up front — once the
 * work is priced, without waiting for task delivery. Omit amountMinor to release
 * the whole remaining budget; pass amountMinor for a partial release. The money
 * sits in the SOW escrow; Glimmora pays contributors from it as work completes.
 */
export async function fundEscrow(
  planId: string,
  amountMinor?: number,
  comment?: string,
): Promise<{ fundedMinor: number; escrow: SowEscrow; status: PayoutStatus }> {
  const body: Record<string, unknown> = {};
  if (amountMinor != null) body.amountMinor = amountMinor;
  if (comment) body.comment = comment;
  return call(`${BASE}/${encodeURIComponent(planId)}/fund-escrow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Glimmora asks the enterprise to top up the SOW escrow (release more budget)
 * when the pre-funded balance is running low. Notifies the enterprise.
 */
export async function requestTopup(
  planId: string,
  amountMinor?: number,
  comment?: string,
): Promise<{ ok: boolean; amountMinor: number | null }> {
  const body: Record<string, unknown> = {};
  if (amountMinor != null) body.amountMinor = amountMinor;
  if (comment && comment.trim()) body.comment = comment.trim();
  return call(`${BASE}/${encodeURIComponent(planId)}/request-topup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Enterprise payment transactions (release history) ────────────────────────
export interface PaymentTxn {
  ref: string;
  at: string;
  amountMinor: number;
  taskCount: number;
  tasks: { title: string | null; amountMinor: number }[];
  by: string | null;
  comment: string | null;
  status: string;   // "released" | "settled"
  method: string;
}
export interface PaymentTransactions {
  planId: string;
  sowId: string | null;
  transactions: PaymentTxn[];
  totalMinor: number;
}
export async function getPaymentTransactions(planId: string): Promise<PaymentTransactions> {
  return call(`${BASE}/${encodeURIComponent(planId)}/payment-transactions`);
}

/** Glimmora disburses to contributors. Pass taskId to scope to one task. */
export async function payoutContributors(planId: string, taskId?: string): Promise<{ paid: number; status: PayoutStatus }> {
  return call(`${BASE}/${encodeURIComponent(planId)}/payout-contributors`, jsonPost(taskId));
}

/** Enterprise submits a draft plan to Glimmora for pricing + approval. draft → submitted. */
export async function submitPlan(planId: string): Promise<PlanDetail> {
  return planAction(planId, "submit");
}

/** Super admin returns a submitted plan to the enterprise/PMO with feedback. submitted → draft. */
export async function sendBackPlan(planId: string, comment?: string): Promise<PlanDetail> {
  const body = await call<{ plan: PlanDetail }>(`${BASE}/${encodeURIComponent(planId)}/send-back`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comment: comment ?? null }),
  });
  return body.plan;
}

export function activatePlan(planId: string): Promise<PlanDetail> {
  return planAction(planId, "activate");
}

export function archivePlan(planId: string): Promise<PlanDetail> {
  return planAction(planId, "archive");
}

export function copyPlan(planId: string): Promise<PlanDetail> {
  return planAction(planId, "copy");
}

/**
 * The backend has no hard-delete — archive is the terminal removal. It drops the
 * plan from the active list, so the source SOW returns to the decomposition queue.
 */
export async function deletePlan(planId: string): Promise<void> {
  await planAction(planId, "archive");
}
