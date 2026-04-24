import { apiCall, ApiError } from "./client";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DashboardKpi {
  key: string;
  label: string;
  value: string;
  trend: "up" | "down" | "flat";
}

export interface EarningsSnapshot {
  currency: string;
  earned_this_month: number;
  total_paid_all_time: number;
  pending_payout: number;
}

export interface ActionItem {
  id: string;
  kind: "deadline_today" | "deadline_soon" | "rework_requested" | "offer_received" | string;
  urgency: "critical" | "high" | "medium" | "low";
  title: string;
  subtitle: string;
  task_id: string;
  offer_id: string;
  cta_label: string;
  cta_href: string;
}

export interface SystemBanner {
  id: string;
  variant: "amber" | "red" | "green" | "blue" | string;
  title: string;
  body: string;
  cta_label: string;
  cta_href: string;
  dismissible: boolean;
  task_id: string;
}

export interface DashboardActiveTask {
  id: string;
  title: string;
  project_title: string;
  milestone_title: string;
  status: string;
  due_at: string;
  due_relative: string;
  priority: string;
  workroom_path: string;
}

export interface DashboardEarning {
  id: string;
  amount: number;
  currency: string;
  label: string;
  earned_at: string;
}

export interface DashboardCredential {
  id: string;
  name: string;
  issuer: string;
  status: string;
  expires_at: string;
}

export interface DashboardSkill {
  id: string;
  name: string;
  level: string;
}

export interface DashboardNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface RecommendedLearning {
  id: string;
  title: string;
  url: string;
  duration_minutes: number;
  reason: string;
}

export interface ContributorDashboardResponse {
  greeting_name: string;
  kpis: DashboardKpi[];
  earnings_snapshot: EarningsSnapshot;
  action_items: ActionItem[];
  system_banners: SystemBanner[];
  active_tasks: DashboardActiveTask[];
  recent_earnings: DashboardEarning[];
  credentials: DashboardCredential[];
  skills: DashboardSkill[];
  notifications: DashboardNotification[];
  recommended_learning: RecommendedLearning[];
}

// ── Notifications list ────────────────────────────────────────────────────────

export interface NotificationsResponse {
  items: DashboardNotification[];
  page: number;
  page_size: number;
  total: number;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function fetchContributorDashboard(
  token: string,
): Promise<ContributorDashboardResponse> {
  return apiCall<ContributorDashboardResponse>("/api/contributor/dashboard", {
    method: "GET",
    token,
  });
}

export async function fetchContributorNotifications(
  token: string,
  page = 1,
  pageSize = 20,
): Promise<NotificationsResponse> {
  return apiCall<NotificationsResponse>(
    `/api/contributor/notifications?page=${page}&page_size=${pageSize}`,
    { method: "GET", token },
  );
}

export async function markNotificationRead(
  token: string,
  notificationId: string,
  read = true,
): Promise<DashboardNotification> {
  return apiCall<DashboardNotification>(
    `/api/contributor/notifications/${notificationId}/read`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify({ read }),
    },
  );
}

export async function markAllNotificationsRead(
  token: string,
): Promise<{ updated: number }> {
  return apiCall<{ updated: number }>(
    "/api/contributor/notifications/read-all",
    { method: "POST", token },
  );
}

// ── Contributor settings ──────────────────────────────────────────────────────

export interface ContributorSettingsResponse {
  account_summary: {
    display_name: string;
    email: string;
    phone: string;
  };
  notification_preferences: {
    task_assignments: boolean;
    review_decisions: boolean;
    sla_reminders: boolean;
    payout_updates: boolean;
    learning: boolean;
  };
  language: string;
  timezone: string;
  quiet_hours_start: string;
  quiet_hours_end: string;
  two_factor_enabled: boolean;
}

export async function fetchContributorSettings(
  token: string,
): Promise<ContributorSettingsResponse> {
  return apiCall<ContributorSettingsResponse>("/api/contributor/settings", {
    method: "GET",
    token,
  });
}

export interface PatchAccountPayload {
  display_name?: string;
  email?: string;
  phone?: string;
}

export async function patchContributorAccount(
  token: string,
  payload: PatchAccountPayload,
): Promise<ContributorSettingsResponse> {
  return apiCall<ContributorSettingsResponse>(
    "/api/contributor/settings/account",
    {
      method: "PATCH",
      token,
      body: JSON.stringify(payload),
    },
  );
}

export async function patchContributorNotifications(
  token: string,
  payload: ContributorSettingsResponse["notification_preferences"],
): Promise<ContributorSettingsResponse> {
  return apiCall<ContributorSettingsResponse>(
    "/api/contributor/settings/notifications",
    {
      method: "PATCH",
      token,
      body: JSON.stringify(payload),
    },
  );
}

export interface PatchLocalePayload {
  language?: string;
  timezone?: string;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

export async function patchContributorLocale(
  token: string,
  payload: PatchLocalePayload,
): Promise<ContributorSettingsResponse> {
  return apiCall<ContributorSettingsResponse>(
    "/api/contributor/settings/locale",
    {
      method: "PATCH",
      token,
      body: JSON.stringify(payload),
    },
  );
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface TwoFASetupResponse {
  qr_uri: string;
  secret: string;
}

/** Initiates 2FA TOTP setup — returns a QR URI to display and the manual secret. */
export async function setup2FA(token: string): Promise<TwoFASetupResponse> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await apiCall<Record<string, any>>(
    "/api/contributor/settings/security/2fa/setup",
    { method: "POST", token },
  );
  // Normalise every possible field name the backend might return
  const qrPng = raw.qr_code_png_base64 ?? raw.qrCodePngBase64 ?? "";
  const otpauthUri = raw.otpauth_uri ?? raw.otpAuthUri ?? "";
  const qr_uri =
    raw.qr_uri ?? (qrPng ? `data:image/png;base64,${qrPng}` : otpauthUri) ?? "";
  const secret =
    raw.secret ?? raw.secret_base32 ?? raw.secretBase32 ?? raw.totp_secret ?? "";
  return { qr_uri, secret };
}

/**
 * Verifies the TOTP code entered by the user after scanning the QR code.
 * On success (200) the backend returns the updated full settings object
 * with two_factor_enabled set to true.
 */
export async function verify2FA(
  token: string,
  code: string,
): Promise<ContributorSettingsResponse> {
  return apiCall<ContributorSettingsResponse>(
    "/api/contributor/settings/security/2fa/verify",
    {
      method: "POST",
      token,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    },
  );
}

/** Returns void — the endpoint responds with 200 or 204 on success. */
export async function changeContributorPassword(
  token: string,
  payload: ChangePasswordPayload,
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? "";
  const res = await fetch(
    `${baseUrl}/api/contributor/settings/security/change-password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  // Both 200 and 204 mean success
  if (res.ok) return;

  // Parse every possible FastAPI error shape
  const body = await res.json().catch(() => ({}));
  const detail = body?.detail;
  let message: string;

  if (typeof detail === "string") {
    message = detail;
  } else if (Array.isArray(detail)) {
    // 422 validation errors: [{ loc, msg, type }]
    message = detail
      .map((e: { loc?: string[]; msg?: string }) => {
        const field = e.loc?.slice(1).join(".") ?? "field";
        return `${field}: ${e.msg ?? "invalid"}`;
      })
      .join("; ");
  } else if (typeof body?.message === "string") {
    message = body.message;
  } else if (typeof body?.error === "string") {
    message = body.error;
  } else {
    // Last resort — show raw body so nothing is hidden
    message = JSON.stringify(body) || `Request failed (${res.status})`;
  }

  throw new ApiError(res.status, message);
}
