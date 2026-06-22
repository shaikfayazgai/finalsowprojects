"use client";

import * as React from "react";
import { MOCK_RECENT_ALERTS, MOCK_SERVICES } from "@/mocks/admin/services";

export function useAdminSystemHealth() {
  return React.useMemo(
    () => ({ services: MOCK_SERVICES, alerts: MOCK_RECENT_ALERTS }),
    [],
  );
}

/** Map degraded services to admin drill-down routes. */
export const SERVICE_DRILLDOWN: Record<string, string> = {
  "payment-router": "/admin/payment-rails/rail-rzp-upi",
  "ai-orchestrator": "/admin/ai",
};
