/**
 * Admin · system health — spec doc 04 §5.M.
 */

export type ServiceStatus = "healthy" | "degraded" | "down";

export interface MockServiceHealth {
  id: string;
  name: string;
  status: ServiceStatus;
  p95LatencyMs: number;
  errors10m: number;
  description?: string;
}

export const MOCK_SERVICES: MockServiceHealth[] = [];

export interface MockAlertEntry {
  id: string;
  severity: "warning" | "critical" | "info";
  text: string;
  at: string;
  ongoing: boolean;
}

export const MOCK_RECENT_ALERTS: MockAlertEntry[] = [];
