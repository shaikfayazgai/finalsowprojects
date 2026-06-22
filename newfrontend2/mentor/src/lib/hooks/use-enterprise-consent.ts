"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  downloadConsentCsv,
  fetchConsentInventory,
  type ConsentQuery,
} from "@/lib/api/enterprise-consent";

export function useConsentInventory(query: ConsentQuery) {
  return useQuery({
    queryKey: ["enterprise", "consent", query],
    queryFn: () => fetchConsentInventory(query),
    staleTime: 60_000,
  });
}

export function useDownloadConsentCsv() {
  return useMutation({
    mutationFn: (query: ConsentQuery) => downloadConsentCsv(query),
  });
}
