"use client";

import * as React from "react";
import type { MockTenant } from "@/mocks/admin/tenants";

interface AdminTenantsState {
  tenants: MockTenant[] | null; // null = not yet loaded
  loading: boolean;
  error: boolean;
  refresh: () => void;
}

/**
 * Fetch the tenant list from the super-admin backend (live data).
 * Returns the MockTenant[] shape the tenant UI already consumes.
 * `tenants === null` until the first response — callers fall back to the
 * local store/mock while loading or if the backend is unavailable.
 * Lean by design (one fetch, no polling) for fast page loads.
 */
export function useAdminTenants(): AdminTenantsState {
  const [tenants, setTenants] = React.useState<MockTenant[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch("/api/superadmin/tenants", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        if (!alive) return;
        const items: MockTenant[] = Array.isArray(data) ? data : data.items ?? [];
        setTenants(items);
        setError(false);
      })
      .catch(() => {
        if (!alive) return;
        setError(true);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [tick]);

  const refresh = React.useCallback(() => setTick((t) => t + 1), []);
  return { tenants, loading, error, refresh };
}
