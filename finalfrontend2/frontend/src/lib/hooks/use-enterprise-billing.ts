"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  downloadBillingCsv,
  getBillingSummary,
  listInvoices,
  listTenantPayouts,
  releasePendingPayoutBatch,
} from "@/lib/api/enterprise-billing";

const keys = {
  tenantPayouts: (params: Parameters<typeof listTenantPayouts>[0]) =>
    ["enterprise-billing", "tenant-payouts", params] as const,
  invoices: () => ["enterprise-billing", "invoices"] as const,
  summary: () => ["enterprise-billing", "summary"] as const,
};

export function useTenantPayouts(params: Parameters<typeof listTenantPayouts>[0] = {}) {
  return useQuery({
    queryKey: keys.tenantPayouts(params),
    queryFn: () => listTenantPayouts(params),
  });
}

export function useEnterpriseInvoices() {
  return useQuery({
    queryKey: keys.invoices(),
    queryFn: () => listInvoices(),
  });
}

export function useEnterpriseBillingSummary() {
  return useQuery({
    queryKey: keys.summary(),
    queryFn: () => getBillingSummary(),
  });
}

export function useReleasePendingBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => releasePendingPayoutBatch(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enterprise-billing"] });
    },
  });
}

export function useDownloadBillingCsv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: downloadBillingCsv,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["enterprise-billing"] }),
  });
}
