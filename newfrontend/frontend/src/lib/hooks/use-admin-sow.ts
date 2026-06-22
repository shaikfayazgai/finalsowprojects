"use client";

/**
 * Platform-admin SOW list — REAL data from the enterprise backend
 * (GET /api/admin/sow → /api/v1/sows/admin/all). Maps backend rows to the
 * SowSummary shape the commercial-gate workspace renders.
 *
 * Stage note: the canonical `mapBackendSummary` resolves the active gate from
 * each row's `approvalStages` (finance → security → legal → platform). A SOW
 * surfaces in the platform commercial queue ONLY once all three enterprise
 * internal gates have signed off (stage === "platform").
 */

import * as React from "react";
import type { SowSummary, SowDetail } from "@/lib/sow/types";
import { mapBackendDetail, mapBackendSummary } from "@/lib/sow/backend-map";

type Row = Record<string, unknown>;

export function useAdminSowList() {
  const [items, setItems] = React.useState<SowSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/sow", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load SOWs (${res.status})`);
      const body = await res.json();
      const rows = (body?.data ?? body?.items ?? body) as unknown;
      const list = Array.isArray(rows) ? (rows as Row[]) : [];
      setItems(list.map(mapBackendSummary));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load SOWs"));
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  return { data: { items }, isLoading, error, refetch: load };
}

/** Single SOW for the platform admin (any tenant) — real backend. */
export function useAdminSow(sowId: string) {
  const [data, setData] = React.useState<SowDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!sowId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/sow/${encodeURIComponent(sowId)}`, { cache: "no-store" });
      if (!res.ok) {
        setData(null);
        return;
      }
      const body = await res.json();
      const row = (body?.data ?? body) as Record<string, unknown>;
      setData(row && row.id ? mapBackendDetail(row) : null);
    } catch {
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [sowId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return { data, isLoading, refetch: load };
}
