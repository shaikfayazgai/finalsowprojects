"use client";

/**
 * Super-admin (Glimmora) billing — the full money view.
 *
 * Fetches the live KPI summary + transaction ledger from the super-admin backend
 * (via the /api/superadmin/billing/* proxies). This is the GLIMMORA view: it sees
 * BOTH money in (enterprise → Glimmora) and money out (Glimmora → contributor),
 * margin, and GST — the enterprise portal hides contributor pay, here it's shown.
 */

import { useQuery } from "@tanstack/react-query";

export interface Money {
  minor: number;
  major: number;
}

export interface BillingKpis {
  inflow: Money;
  outflow: Money;
  margin: Money;
  gst: Money;
  pending: Money & { count: number };
  paid: Money & { count: number };
  sowsWithPayments: number;
  failedTransactions: number;
  escrow: { funded: Money; spent: Money; remaining: Money };
}

export interface BillingSummary {
  currency: string;
  config: { commissionPct: number; gstPct: number };
  kpis: BillingKpis;
}

export type BillingDirection = "in" | "out";

export interface BillingTransaction {
  id: string;
  direction: BillingDirection;
  sowId: string | null;
  sowName: string | null;
  taskId: string | null;
  taskTitle: string | null;
  counterparty: string;
  counterpartyRole: "enterprise" | "contributor";
  amountMinor: number;
  amount: number;
  currency: string;
  status: string;
  transactionId: string | null;
  date: string | null;
}

const EMPTY_SUMMARY: BillingSummary = {
  currency: "INR",
  config: { commissionPct: 15, gstPct: 18 },
  kpis: {
    inflow: { minor: 0, major: 0 },
    outflow: { minor: 0, major: 0 },
    margin: { minor: 0, major: 0 },
    gst: { minor: 0, major: 0 },
    pending: { minor: 0, major: 0, count: 0 },
    paid: { minor: 0, major: 0, count: 0 },
    sowsWithPayments: 0,
    failedTransactions: 0,
    escrow: {
      funded: { minor: 0, major: 0 },
      spent: { minor: 0, major: 0 },
      remaining: { minor: 0, major: 0 },
    },
  },
};

export function useAdminBillingSummary() {
  const query = useQuery({
    queryKey: ["admin", "billing", "summary"],
    queryFn: async (): Promise<BillingSummary> => {
      const res = await fetch("/api/superadmin/billing/summary", { cache: "no-store" });
      if (!res.ok) throw new Error(`billing-summary ${res.status}`);
      const body = (await res.json()) as Partial<BillingSummary>;
      return {
        currency: body.currency ?? EMPTY_SUMMARY.currency,
        config: body.config ?? EMPTY_SUMMARY.config,
        kpis: { ...EMPTY_SUMMARY.kpis, ...(body.kpis ?? {}) },
      };
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  return {
    summary: query.data ?? EMPTY_SUMMARY,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useAdminBillingTransactions(opts?: {
  direction?: BillingDirection | "all";
  status?: string | "all";
}) {
  const direction = opts?.direction && opts.direction !== "all" ? opts.direction : undefined;
  const status = opts?.status && opts.status !== "all" ? opts.status : undefined;

  const query = useQuery({
    queryKey: ["admin", "billing", "transactions", direction ?? "all", status ?? "all"],
    queryFn: async (): Promise<BillingTransaction[]> => {
      const params = new URLSearchParams({ limit: "300" });
      if (direction) params.set("direction", direction);
      if (status) params.set("status", status);
      const res = await fetch(`/api/superadmin/billing/transactions?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`billing-transactions ${res.status}`);
      const body = (await res.json()) as { items?: BillingTransaction[] };
      return body.items ?? [];
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  return {
    transactions: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
