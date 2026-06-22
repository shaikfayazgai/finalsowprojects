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

export const MOCK_SERVICES: MockServiceHealth[] = [
  { id: "svc-auth",          name: "auth-service",          status: "healthy",  p95LatencyMs: 80,   errors10m: 0,  description: "NextAuth-backed sign-in + session validation" },
  { id: "svc-tenant",        name: "tenant-service",        status: "healthy",  p95LatencyMs: 60,   errors10m: 0 },
  { id: "svc-task",          name: "task-service",          status: "healthy",  p95LatencyMs: 110,  errors10m: 2 },
  { id: "svc-review",        name: "review-service",        status: "healthy",  p95LatencyMs: 90,   errors10m: 0 },
  { id: "svc-audit",         name: "audit-service",         status: "healthy",  p95LatencyMs: 40,   errors10m: 0 },
  { id: "svc-payment",       name: "payment-router",        status: "degraded", p95LatencyMs: 2100, errors10m: 12, description: "Routes payouts to provider rails" },
  { id: "svc-notif",         name: "notification-svc",      status: "healthy",  p95LatencyMs: 110,  errors10m: 0 },
  { id: "svc-ai",            name: "ai-orchestrator",       status: "healthy",  p95LatencyMs: 1800, errors10m: 0 },
  { id: "svc-file",          name: "file-scan-service",     status: "healthy",  p95LatencyMs: 5000, errors10m: 0,  description: "Antivirus + MIME validation on uploads" },
  { id: "svc-skill",         name: "skill-graph-service",   status: "healthy",  p95LatencyMs: 150,  errors10m: 0 },
  { id: "svc-kyc",           name: "kyc-service",           status: "healthy",  p95LatencyMs: 200,  errors10m: 0 },
  { id: "svc-email",         name: "email-service",         status: "healthy",  p95LatencyMs: 800,  errors10m: 0 },
];

export interface MockAlertEntry {
  id: string;
  severity: "warning" | "critical" | "info";
  text: string;
  at: string;
  ongoing: boolean;
}

export const MOCK_RECENT_ALERTS: MockAlertEntry[] = [
  { id: "al-1", severity: "warning",  text: "payment-router error rate elevated",      at: "2026-05-27T05:00:00Z", ongoing: true  },
  { id: "al-2", severity: "info",     text: "task-service latency recovered",          at: "2026-05-26T23:00:00Z", ongoing: false },
  { id: "al-3", severity: "info",     text: "ai-orchestrator cold-start spike resolved", at: "2026-05-26T11:00:00Z", ongoing: false },
];
