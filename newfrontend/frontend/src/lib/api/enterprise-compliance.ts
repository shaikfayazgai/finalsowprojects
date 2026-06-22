/**
 * Enterprise compliance client — REAL.
 * Reads /api/enterprise/compliance/overview → /api/v1/enterprise/compliance/overview,
 * which computes consent coverage (from real consent rows), retention rules, and
 * deletion-request counts (from the Mongo audit log). No mock data.
 */

import { fetchInternal } from "@/lib/api/client";

export class ComplianceApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
    this.name = "ComplianceApiError";
  }
}

export interface ComplianceOverview {
  tenantId: string;
  consent: {
    totalContributors: number;
    withConsent: number;
    missingConsent: number;
  };
  retention: {
    auditEvents: string;
    taskEvidence: string;
    withdrawnSubmissions: string;
  };
  deletionRequests: {
    pending: number;
    completedLast30Days: number;
  };
}

export async function fetchComplianceOverview(): Promise<ComplianceOverview> {
  const res = await fetchInternal("/api/enterprise/compliance/overview", { method: "GET" });
  if (!res.ok) {
    throw new ComplianceApiError(`Failed to load compliance (${res.status})`, res.status);
  }
  return res.json();
}
