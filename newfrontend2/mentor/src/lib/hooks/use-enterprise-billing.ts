"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { downloadBillingCsv, listTenantPayouts, releasePendingPayoutBatch } from "@/lib/api/enterprise-billing";
import { payoutOverlay } from "@/lib/enterprise/mocks/payouts";
import { useOverlayVersion } from "@/lib/enterprise/mocks/overlay";

const keys = {
  tenantPayouts: (params: Parameters<typeof listTenantPayouts>[0]) =>
    ["enterprise-billing", "tenant-payouts", params] as const,
};

export function useTenantPayouts(params: Parameters<typeof listTenantPayouts>[0] = {}) {
  const overlayTick = useOverlayVersion(payoutOverlay);
  return useQuery({
    queryKey: [...keys.tenantPayouts(params), overlayTick] as const,
    queryFn: () => listTenantPayouts(params),
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
  // Not strictly a mutation in the cache sense — but useMutation gives
  // us isPending + onError for the UI.
  const qc = useQueryClient();
  return useMutation({
    mutationFn: downloadBillingCsv,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["enterprise-billing"] }),
  });
}
