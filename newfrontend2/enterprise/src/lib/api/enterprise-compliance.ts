/**
 * Enterprise compliance client — MOCK MODE.
 * Backend handoff: see src/lib/enterprise/mocks/compliance.ts for the
 * shape; replace each function body with a fetch() call.
 */

import { complianceOverviewMock } from "@/lib/enterprise/mocks/compliance";

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

function tick<T>(value: T, ms = 80): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), ms));
}

export async function fetchComplianceOverview(): Promise<ComplianceOverview> {
  return tick(complianceOverviewMock());
}
