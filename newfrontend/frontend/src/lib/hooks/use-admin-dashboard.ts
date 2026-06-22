"use client";

import * as React from "react";
import { MOCK_ADMIN_DASHBOARD, type MockAdminDashboard } from "@/mocks/admin/dashboard";

/**
 * Platform-admin dashboard metrics from the real super-admin backend
 * (GET /api/superadmin/dashboard → live DB counts: tenants, mentors, active
 * SOWs, governance open, KYC pending, recent audit). Returns the
 * MockAdminDashboard shape the dashboard UI already consumes.
 *
 * Until the first response (or if the backend is unavailable) it returns the
 * all-zero / empty MOCK_ADMIN_DASHBOARD so the dashboard renders empty rather
 * than with fabricated numbers.
 */
export function useAdminDashboard(): { data: MockAdminDashboard; loading: boolean; error: boolean } {
  const [data, setData] = React.useState<MockAdminDashboard>(MOCK_ADMIN_DASHBOARD);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    fetch("/api/superadmin/dashboard", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((body) => {
        if (!alive) return;
        const d = (body?.data ?? body) as Partial<MockAdminDashboard>;
        // Merge over the zero baseline so any field the backend omits stays 0/empty.
        setData({
          ...MOCK_ADMIN_DASHBOARD,
          ...d,
          kpis: { ...MOCK_ADMIN_DASHBOARD.kpis, ...(d.kpis ?? {}) },
          pipeline: { ...MOCK_ADMIN_DASHBOARD.pipeline, ...(d.pipeline ?? {}) },
          actionBreakdown: { ...MOCK_ADMIN_DASHBOARD.actionBreakdown, ...(d.actionBreakdown ?? {}) },
          attention: Array.isArray(d.attention) ? d.attention : [],
          recent: Array.isArray(d.recent) ? d.recent : [],
          aiSignals: Array.isArray(d.aiSignals) ? d.aiSignals : [],
        });
        setError(false);
      })
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return { data, loading, error };
}
