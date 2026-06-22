"use client";

import * as React from "react";
import type { MockTenant } from "@/mocks/admin/tenants";

type Status = "loading" | "ok" | "notFound" | "unauthorized" | "error";

interface AdminTenantState {
  tenant: MockTenant | null;
  status: Status;
  refresh: () => void;
}

/**
 * Fetch a single tenant from the super-admin backend detail endpoint.
 * Distinguishes 404 (notFound) from 401 (unauthorized → session expired) so the
 * UI can redirect to login instead of showing a misleading "not found".
 * Lean single fetch for fast detail loads.
 */
export function useAdminTenant(tenantId: string): AdminTenantState {
  const [tenant, setTenant] = React.useState<MockTenant | null>(null);
  const [status, setStatus] = React.useState<Status>("loading");
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    if (!tenantId) return;
    let alive = true;
    setStatus("loading");
    fetch(`/api/superadmin/tenants/${encodeURIComponent(tenantId)}`, { cache: "no-store" })
      .then(async (r) => {
        if (!alive) return;
        if (r.status === 401) {
          setStatus("unauthorized");
          return;
        }
        if (r.status === 404) {
          setStatus("notFound");
          return;
        }
        if (!r.ok) {
          setStatus("error");
          return;
        }
        const data = (await r.json()) as MockTenant;
        setTenant(data);
        setStatus("ok");
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
  }, [tenantId, tick]);

  const refresh = React.useCallback(() => setTick((t) => t + 1), []);
  return { tenant, status, refresh };
}
