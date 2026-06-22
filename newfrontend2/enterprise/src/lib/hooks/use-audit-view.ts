"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  downloadAuditExport,
  fetchAuditEvents,
  type AuditViewQuery,
} from "@/lib/api/audit-view";

export function useAuditEvents(query: AuditViewQuery) {
  return useQuery({
    queryKey: ["audit-view", query],
    queryFn: () => fetchAuditEvents(query),
  });
}

export function useDownloadAuditExport() {
  return useMutation({
    mutationFn: ({
      query,
      format,
    }: {
      query: AuditViewQuery;
      format: "csv" | "json" | "ndjson";
    }) => downloadAuditExport(query, format),
  });
}
