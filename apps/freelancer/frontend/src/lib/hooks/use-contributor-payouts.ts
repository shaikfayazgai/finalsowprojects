"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  createMyPayoutMethod,
  deleteMyPayoutMethod,
  getMyCredentialWithFallback,
  listMyCredentialsWithFallback,
  listMyPayoutMethodsWithDemo,
  listMyPayouts,
  requestPayoutWithdrawal,
  setDefaultMyPayoutMethod,
} from "@/lib/api/contributor-payouts";
import { payoutOverlay } from "@/lib/enterprise/mocks/payouts";
import { useOverlayVersion } from "@/lib/enterprise/mocks/overlay";

const keys = {
  payouts: ["contributor", "payouts"] as const,
  methods: ["contributor", "payouts", "methods"] as const,
  credentials: ["contributor", "credentials"] as const,
  credential: (id: string) => ["contributor", "credentials", id] as const,
};

export function useMyPayouts(params: { status?: string | string[] } = {}) {
  const { data: session } = useSession();
  const overlayTick = useOverlayVersion(payoutOverlay);
  return useQuery({
    queryKey: [...keys.payouts, params, session?.user?.email ?? "", overlayTick] as const,
    queryFn: () =>
      listMyPayouts({
        ...params,
        contributorEmail: session?.user?.email ?? null,
      }),
  });
}

export function useMyPayoutMethods() {
  const { data: session } = useSession();
  const overlayTick = useOverlayVersion(payoutOverlay);
  return useQuery({
    queryKey: [...keys.methods, session?.user?.email ?? "", overlayTick] as const,
    queryFn: () => listMyPayoutMethodsWithDemo(session?.user?.email ?? null),
  });
}

export function useRequestWithdrawal(payoutId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payoutMethodId?: string) => requestPayoutWithdrawal(payoutId, payoutMethodId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.payouts });
    },
  });
}

export function useCreatePayoutMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createMyPayoutMethod>[0]) =>
      createMyPayoutMethod(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.methods }),
  });
}

export function useSetDefaultMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (methodId: string) => setDefaultMyPayoutMethod(methodId),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.methods }),
  });
}

export function useDeletePayoutMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (methodId: string) => deleteMyPayoutMethod(methodId),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.methods }),
  });
}

export function useMyCredentials(params: { status?: "issued" | "revoked" } = {}) {
  return useQuery({
    queryKey: [...keys.credentials, params],
    queryFn: () => listMyCredentialsWithFallback(params),
  });
}

export function useMyCredential(credentialId: string | undefined) {
  return useQuery({
    queryKey: credentialId ? keys.credential(credentialId) : ["contributor", "credentials", "—"],
    queryFn: () => {
      if (!credentialId) throw new Error("credentialId required");
      return getMyCredentialWithFallback(credentialId);
    },
    enabled: !!credentialId,
  });
}
