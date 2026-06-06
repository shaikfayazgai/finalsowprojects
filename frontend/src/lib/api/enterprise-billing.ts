import { apiCall } from "./client";

/** Enterprise billing + deliverable-review API client (enterprise-service). */

export interface ApiInvoice {
  id: string; number: string; projectId?: string; status: string;
  amount: number; paidAmount: number; currency: string;
  issuedDate?: string; dueDate?: string; lineItems?: { description: string; amount: number }[];
}
export interface BillingSummary {
  totalSpent: number; pendingPayments: number; escrowHeld: number;
  averagePaymentTime: number; activeInvoices: number;
  monthlySpend: { month: string; amount: number }[];
}
export interface ApiDeliverable {
  id: string; title: string; projectId?: string; status: string;
  contributor?: string; submittedAt?: string; version?: number; score?: number;
}

export function listInvoices(token: string) {
  return apiCall<{ invoices: ApiInvoice[] }>("/api/v1/billing/invoices", { method: "GET", token });
}
export function getBillingSummary(token: string) {
  return apiCall<BillingSummary>("/api/v1/billing/summary", { method: "GET", token });
}
export function listDeliverables(token: string) {
  return apiCall<{ deliverables: ApiDeliverable[] }>("/api/v1/review/deliverables", { method: "GET", token });
}
export function decideDeliverable(token: string, id: string, decision: "approve" | "reject" | "rework", note?: string) {
  return apiCall<ApiDeliverable>(`/api/v1/review/deliverables/${id}/decision`, {
    method: "POST", token, body: JSON.stringify({ decision, note }),
  });
}
