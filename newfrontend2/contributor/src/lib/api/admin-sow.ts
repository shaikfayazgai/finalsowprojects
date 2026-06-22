/**
 * Admin SOW API client — admin-only endpoints.
 *
 * GET /api/v1/sows/enterprise/all   Admin: list all enterprise SOWs
 * GET /api/v1/sows/enterprise/{id}  Admin: get one enterprise SOW by ID
 *
 * Uses the logged-in admin's personal Glimmora access token (from session).
 */

import { ApiError } from "./client";
import type { BaseResponse } from "./sow";
import type { AdminApprovalStageStatuses } from "@/types/enterprise";

export interface AdminSowListItem {
  id?: string;
  _id?: string;
  sow_id?: string;
  wizard_id?: string;
  approval_stage_statuses?: AdminApprovalStageStatuses;
  [key: string]: unknown;
}

export interface AdminSowListResponse extends Omit<BaseResponse, "data"> {
  data?: AdminSowListItem[] | { [key: string]: unknown } | null;
}

// ── Token cache ───────────────────────────────────────────────────────────

let _cachedToken: string | null = null;

async function getAdminToken(): Promise<string> {
  if (_cachedToken) return _cachedToken;

  const res = await fetch("/api/sow/token");
  if (!res.ok) throw new ApiError(res.status, "Failed to acquire admin API token");

  const data = await res.json();
  _cachedToken = data.token;

  setTimeout(() => { _cachedToken = null; }, 50 * 60 * 1000);

  return data.token;
}

const BASE_URL = process.env.NEXT_PUBLIC_GLIMMORA_API_URL || "";

async function adminCall<T>(path: string, _retry = false): Promise<T> {
  const token = await getAdminToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && !_retry) {
      _cachedToken = null;
      return adminCall<T>(path, true);
    }
    const msg = data?.detail?.message ?? data?.detail ?? data?.message ?? `API error ${res.status}`;
    throw new ApiError(res.status, typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  return data as T;
}

// ── Admin SOW API ─────────────────────────────────────────────────────────

export const adminSowApi = {
  /** GET /api/v1/sows/enterprise/all — list all enterprise SOWs */
  listEnterpriseSOWs(): Promise<AdminSowListResponse> {
    return adminCall<AdminSowListResponse>("/api/v1/sows/enterprise/all");
  },

  /** GET /api/v1/sows/enterprise/{sow_id} — get one enterprise SOW by ID */
  getEnterpriseSOWById(sowId: string): Promise<BaseResponse> {
    return adminCall<BaseResponse>(`/api/v1/sows/enterprise/${sowId}`);
  },

  /** GET /api/v1/approvals/{sow_id} — get approval pipeline status */
  getApprovalPipeline(sowId: string): Promise<BaseResponse> {
    return adminCall<BaseResponse>(`/api/v1/approvals/${sowId}`);
  },
};
