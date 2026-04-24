import { fetchInternal, ApiError } from "./client";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ContributorPricingStudentConfig {
  currency: string;
  hourlyRate: number;
}

export interface ContributorPricingSlab {
  id: string;
  minYears: number;
  maxYears: number | null;
  currency: string;
  rate: number;
}

export interface UpdateContributorPricingPayload {
  student: ContributorPricingStudentConfig;
  workforceSlabs: ContributorPricingSlab[];
}

export interface ContributorPricingConfigResponse {
  student: ContributorPricingStudentConfig;
  workforceSlabs: ContributorPricingSlab[];
}

export interface ContributorPricingForForms {
  studentCurrency: string;
  studentHourlyRate: string;
  workforceCurrency: string;
  workforceRateTable: Record<string, string>;
}

/** Shape returned by GET /api/v1/settings/contributor-pricing (admin) */
export interface GetContributorPricingResponse {
  success: boolean;
  message?: string;
  data: {
    student: ContributorPricingStudentConfig;
    workforceSlabs: ContributorPricingSlab[];
    updatedAt?: string;
    updatedBy?: string;
  };
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * Calls the Next.js proxy route which forwards the request to:
 *   PUT /api/v1/settings/contributor-pricing
 *
 * The proxy attaches the super-admin Bearer token server-side so the
 * access token is never exposed to the browser.
 */
export async function updateContributorPricing(
  payload: UpdateContributorPricingPayload,
): Promise<ContributorPricingConfigResponse> {
  const res = await fetchInternal("/api/settings/contributor-pricing", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail =
      (data as { error?: string; detail?: string }).error ??
      (data as { detail?: string }).detail ??
      `API error ${res.status}`;
    throw new Error(String(detail));
  }

  return data as ContributorPricingConfigResponse;
}

/**
 * GET /api/settings/contributor-pricing (admin proxy)
 * Returns the current live pricing config from the backend.
 * Requires an active enterprise_admin NextAuth session.
 */
export async function getContributorPricing(): Promise<GetContributorPricingResponse> {
  const res = await fetchInternal("/api/settings/contributor-pricing", {
    method: "GET",
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail =
      (data as { error?: string; detail?: string }).error ??
      (data as { detail?: string }).detail ??
      `API error ${res.status}`;
    throw new ApiError(res.status, String(detail));
  }

  return data as GetContributorPricingResponse;
}

// ── Payload builders ──────────────────────────────────────────────────────────

/** Slab definitions for Women Workforce (prefix "ww-") */
export const WOMEN_SLABS: Omit<ContributorPricingSlab, "currency" | "rate">[] = [
  { id: "ww-0-1",    minYears: 0,  maxYears: 1  },
  { id: "ww-1-3",    minYears: 1,  maxYears: 3  },
  { id: "ww-3-5",    minYears: 3,  maxYears: 5  },
  { id: "ww-5-10",   minYears: 5,  maxYears: 10 },
  { id: "ww-10-plus",minYears: 10, maxYears: null },
];

/** Slab definitions for General Workforce (prefix "gw-") */
export const GENERAL_SLABS: Omit<ContributorPricingSlab, "currency" | "rate">[] = [
  { id: "gw-0-1",    minYears: 0,  maxYears: 1  },
  { id: "gw-1-3",    minYears: 1,  maxYears: 3  },
  { id: "gw-3-5",    minYears: 3,  maxYears: 5  },
  { id: "gw-5-10",   minYears: 5,  maxYears: 10 },
  { id: "gw-10-plus",minYears: 10, maxYears: null },
];

/** Rate-key order that maps to slab positions */
export const RATE_KEYS = ["exp0to1", "exp1to3", "exp3to5", "exp5to10", "exp10plus"] as const;
export type RateKey = typeof RATE_KEYS[number];
