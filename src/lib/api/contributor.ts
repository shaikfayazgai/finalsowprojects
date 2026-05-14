import { apiCall, fetchInternal, ApiError } from "./client";

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
  // Read-only freelancer summary surfaced on the settings page.
  // Editing happens on /contributor/profile.
  freelancer_profile?: {
    full_name: string | null;
    skills: string[];
    experience_level: string | null;
    portfolio_url: string | null;
    linkedin: string | null;
    weekly_hours: number | null;
    availability: string | null;
    country: string | null;
    city: string | null;
  };
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
      body: JSON.stringify({ verification_code: code }),
    },
  );
}

export interface Disable2FAPayload {
  password: string;
  verification_code: string;
}

/** Disables 2FA — requires the account password + current TOTP code for security. */
export async function disable2FA(
  token: string,
  payload: Disable2FAPayload,
): Promise<ContributorSettingsResponse> {
  return apiCall<ContributorSettingsResponse>(
    "/api/contributor/settings/security/2fa/disable",
    {
      method: "POST",
      token,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}

/** Returns void — the endpoint responds with 200 or 204 on success. */
export async function changeContributorPassword(
  token: string,
  payload: ChangePasswordPayload,
): Promise<void> {
  await apiCall<unknown>("/api/contributor/settings/security/change-password", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

// ── Task detail ───────────────────────────────────────────────────────────────

export interface ReferenceMaterial {
  id: string;
  name: string;
  url: string;
  description: string;
}

export interface TaskDetail {
  id: string;
  project_id: string;
  project_title: string;
  milestone_title: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  skills_required: string[];
  estimated_hours: number;
  pricing: { amount: number; currency: string; model: string };
  match_score: number;
  match_reason: string;
  due_date: string;
  sla_deadline: string;
  assigned_at: string | null;
  started_at: string | null;
  submitted_at: string | null;
  accepted_at: string | null;
  review_score: number | null;
  review_comment: string | null;
  rework_reason: string | null;
  rework_deadline: string | null;
  acceptance_criteria: string[];
  evidence_types_required: string[];
  milestone_number: number;
  reference_materials: ReferenceMaterial[];
  reviewer_guidance_preview: string | null;
  domain_tag: string;
  seniority_required: string;
  contributor_seniority: string;
  skills_matched: string[];
  offer_expires_at: string | null;
  offered_at: string | null;
  data_sensitivity: string;
  nda_required: boolean;
  effort_display: string;
}

export async function fetchTask(
  token: string,
  taskId: string,
): Promise<TaskDetail> {
  return apiCall<TaskDetail>(
    `/api/contributor/tasks/${encodeURIComponent(taskId)}`,
    { method: "GET", token, cache: "no-store" },
  );
}

// ── Workroom links ────────────────────────────────────────────────────────────

export async function fetchWorkroomLinks(
  token: string,
  taskId: string,
): Promise<WorkroomLink[]> {
  const raw = await apiCall<WorkroomLink | WorkroomLink[]>(
    `/api/contributor/tasks/${encodeURIComponent(taskId)}/workroom/links`,
    { method: "GET", token, cache: "no-store" },
  );
  return Array.isArray(raw) ? raw : [raw];
}

// ── Workroom templates ────────────────────────────────────────────────────────

export async function fetchWorkroomTemplates(
  token: string,
  taskId: string,
): Promise<WorkroomTemplate[]> {
  // The endpoint may return a single object or an array — normalise to array
  const raw = await apiCall<WorkroomTemplate | WorkroomTemplate[]>(
    `/api/contributor/tasks/${encodeURIComponent(taskId)}/workroom/templates`,
    { method: "GET", token, cache: "no-store" },
  );
  return Array.isArray(raw) ? raw : [raw];
}

// ── Workroom ─────────────────────────────────────────────────────────────────

export interface WorkroomTemplate {
  id: string;
  name: string;
  url: string;
  description: string;
}

export interface WorkroomLink {
  id: string;
  title: string;
  url: string;
  description: string;
}

export interface WorkroomUpload {
  id: string;
  filename: string;
  category: string;
  title: string;
  description: string;
  uploaded_at: string;
  size_bytes: number;
}

export interface WorkroomChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  completed_at?: string;
  notes?: string;
}

export interface Workroom {
  instructions: string;
  templates: WorkroomTemplate[];
  links: WorkroomLink[];
  uploads: WorkroomUpload[];
  checklist?: WorkroomChecklistItem[];   // present when the server returns them
}

export async function fetchWorkroom(
  token: string,
  taskId: string,
): Promise<Workroom> {
  return apiCall<Workroom>(
    `/api/contributor/tasks/${encodeURIComponent(taskId)}/workroom`,
    { method: "GET", token, cache: "no-store" },
  );
}

// ── Upload workroom file ──────────────────────────────────────────────────────

export interface UploadWorkroomFilePayload {
  file: File;
  category: string;                 // required
  title?: string;
  description?: string;
}

export interface UploadWorkroomFileResponse {
  id: string;
  filename: string;
  category: string;
  title: string;
  description: string;
  uploaded_at: string;
}

export async function uploadWorkroomFile(
  token: string,
  taskId: string,
  payload: UploadWorkroomFilePayload,
): Promise<UploadWorkroomFileResponse> {
  const form = new FormData();
  form.append("file", payload.file);
  form.append("category", payload.category);
  if (payload.title)       form.append("title", payload.title);
  if (payload.description) form.append("description", payload.description);

  const res = await fetchInternal(
    `/api/contributor/tasks/${encodeURIComponent(taskId)}/workroom/uploads`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
      signal: AbortSignal.timeout(60_000),
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = body?.detail ?? body?.message ?? `Upload failed (${res.status})`;
    const message = typeof detail === "string"
      ? detail
      : Array.isArray(detail)
        ? detail.map((e: { loc?: string[]; msg?: string }) => `${e.loc?.slice(1).join(".") ?? "field"}: ${e.msg ?? "invalid"}`).join("; ")
        : JSON.stringify(detail);
    throw new Error(message);
  }

  return res.json() as Promise<UploadWorkroomFileResponse>;
}

// ── Patch checklist item ──────────────────────────────────────────────────────

export interface PatchChecklistItemPayload {
  completed: boolean;
  evidence_file_id?: string;
  notes?: string;
}

export async function patchChecklistItem(
  token: string,
  taskId: string,
  itemId: string,
  payload: PatchChecklistItemPayload,
): Promise<string> {
  return apiCall<string>(
    `/api/contributor/tasks/${encodeURIComponent(taskId)}/workroom/checklist/${encodeURIComponent(itemId)}`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify(payload),
    },
  );
}

// ── Delete workroom upload ────────────────────────────────────────────────────

export async function deleteWorkroomUpload(
  token: string,
  taskId: string,
  uploadId: string,
): Promise<void> {
  const res = await fetchInternal(
    `/api/contributor/tasks/${encodeURIComponent(taskId)}/workroom/uploads/${encodeURIComponent(uploadId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(30_000),
    },
  );

  // 204 No Content is success — no body to parse
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    const detail = body?.detail ?? body?.message ?? `Delete failed (${res.status})`;
    const message = typeof detail === "string"
      ? detail
      : Array.isArray(detail)
        ? detail.map((e: { loc?: string[]; msg?: string }) => `${e.loc?.slice(1).join(".") ?? "field"}: ${e.msg ?? "invalid"}`).join("; ")
        : JSON.stringify(detail);
    throw new Error(message);
  }
}

// ── List workroom messages ────────────────────────────────────────────────────

export interface WorkroomMessage {
  id: string;
  author: string;
  message: string;
  created_at: string;
  attachment_ids: string[];
}

export interface WorkroomMessagesResponse {
  items: WorkroomMessage[];
  page: number;
  page_size: number;
  total: number;
}

export interface WorkroomMessagesParams {
  page?: number;
  page_size?: number;
}

export async function fetchWorkroomMessages(
  token: string,
  taskId: string,
  params: WorkroomMessagesParams = {},
): Promise<WorkroomMessagesResponse> {
  const qs = new URLSearchParams();
  if (params.page)      qs.set("page",      String(params.page));
  if (params.page_size) qs.set("page_size", String(params.page_size));
  const query = qs.toString() ? `?${qs}` : "";
  return apiCall<WorkroomMessagesResponse>(
    `/api/contributor/tasks/${encodeURIComponent(taskId)}/workroom/messages${query}`,
    { method: "GET", token, cache: "no-store" },
  );
}

// ── Post workroom message ────────────────────────────────────────────────────

export interface PostWorkroomMessagePayload {
  message: string;
  attachment_ids?: string[];
}

export async function postWorkroomMessage(
  token: string,
  taskId: string,
  payload: PostWorkroomMessagePayload,
): Promise<string> {
  return apiCall<string>(
    `/api/contributor/tasks/${encodeURIComponent(taskId)}/workroom/messages`,
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    },
  );
}

// ── Task timeline ─────────────────────────────────────────────────────────────

export interface TaskTimelineEvent {
  id: string;
  event_type: string;
  at: string;
  label: string;
  metadata?: Record<string, unknown>;
}

export async function fetchTaskTimeline(
  token: string,
  taskId: string,
): Promise<TaskTimelineEvent[]> {
  return apiCall<TaskTimelineEvent[]>(
    `/api/contributor/tasks/${encodeURIComponent(taskId)}/timeline`,
    { method: "GET", token, cache: "no-store" },
  );
}

// ── Request extension ─────────────────────────────────────────────────────────

export interface RequestExtensionPayload {
  requested_due_date: string;          // YYYY-MM-DD
  reason: string;
  notes?: string;
  supporting_attachment_ids?: string[];
}

export interface RequestExtensionResponse {
  ok: boolean;
  message: string;
}

export async function requestExtension(
  token: string,
  taskId: string,
  payload: RequestExtensionPayload,
): Promise<RequestExtensionResponse> {
  return apiCall<RequestExtensionResponse>(
    `/api/contributor/tasks/${encodeURIComponent(taskId)}/request-extension`,
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    },
  );
}

// ── Start task ───────────────────────────────────────────────────────────────

export interface StartTaskPayload {
  started_at: string;
}

export interface StartTaskResponse {
  ok: boolean;
  message: string;
}

export async function startTask(
  token: string,
  taskId: string,
  payload: StartTaskPayload,
): Promise<StartTaskResponse> {
  return apiCall<StartTaskResponse>(
    `/api/contributor/tasks/${encodeURIComponent(taskId)}/start`,
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    },
  );
}

// ── Decline task ─────────────────────────────────────────────────────────────

export interface DeclineTaskPayload {
  reason: string;
  notes?: string;
}

export interface DeclineTaskResponse {
  ok: boolean;
  message: string;
}

export async function declineTask(
  token: string,
  taskId: string,
  payload: DeclineTaskPayload,
): Promise<DeclineTaskResponse> {
  return apiCall<DeclineTaskResponse>(
    `/api/contributor/tasks/${encodeURIComponent(taskId)}/decline`,
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    },
  );
}

// ── Accept task ──────────────────────────────────────────────────────────────

export interface AcceptTaskPayload {
  accepted_at: string;
  note?: string;
}

export interface AcceptTaskResponse {
  ok: boolean;
  message: string;
}

export async function acceptTask(
  token: string,
  taskId: string,
  payload: AcceptTaskPayload,
): Promise<AcceptTaskResponse> {
  return apiCall<AcceptTaskResponse>(
    `/api/contributor/tasks/${encodeURIComponent(taskId)}/accept`,
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    },
  );
}

// ── Accept impact ────────────────────────────────────────────────────────────

export interface AcceptImpact {
  current_active_tasks: number;
  hours_committed_this_week: number;
  declared_hours_per_week: number;
  task_estimated_hours: number;
  after_accept_weekly_hours: number;
  capacity_percent_after: number;
  would_exceed_capacity: boolean;
  advisory_near_capacity: boolean;
  concurrent_deadlines_notice: string;
  accept_allowed: boolean;
}

export async function fetchAcceptImpact(
  token: string,
  taskId: string,
): Promise<AcceptImpact> {
  return apiCall<AcceptImpact>(
    `/api/contributor/tasks/${encodeURIComponent(taskId)}/accept-impact`,
    { method: "GET", token, cache: "no-store" },
  );
}

// ── Tasks list ───────────────────────────────────────────────────────────────

export interface TaskItemPricing {
  amount: number;
  currency: string;
  model: string;
}

export interface TaskItem {
  id: string;
  title: string;
  project_title: string;
  project_id?: string;
  milestone_title: string;
  status: string;
  priority: string;
  skills_required: string[];
  estimated_hours: number;
  pricing: TaskItemPricing;
  match_score: number;
  match_reason: string;
  due_date: string;
  sla_deadline: string;
  progress_percent: number;
  hours_logged: number;
  domain_tag: string;
  seniority_required: string;
  contributor_seniority: string;
  skills_matched: string[];
  offer_expires_at: string | null;
  offered_at: string | null;
  data_sensitivity: string;
  nda_required: boolean;
  effort_display: string;
}

export interface TasksListResponse {
  items: TaskItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface TasksListParams {
  status?: string;
  priority?: string;
  time_filter?: string;
  q?: string;
  sort_by?: string;
  sort_dir?: string;
  page?: number;
  page_size?: number;
  discovery_feed?: boolean;
  skill_tag?: string;
  effort?: string;
  deadline_within?: string;
}

export async function fetchTasks(
  token: string,
  params: TasksListParams = {},
): Promise<TasksListResponse> {
  const q = new URLSearchParams();
  if (params.status)                        q.set("status",           params.status);
  if (params.priority)                      q.set("priority",         params.priority);
  if (params.time_filter)                   q.set("time_filter",      params.time_filter);
  if (params.q)                             q.set("q",                params.q);
  if (params.sort_by)                       q.set("sort_by",          params.sort_by);
  if (params.sort_dir)                      q.set("sort_dir",         params.sort_dir);
  if (params.page      !== undefined)       q.set("page",             String(params.page));
  if (params.page_size !== undefined)       q.set("page_size",        String(params.page_size));
  if (params.discovery_feed !== undefined)  q.set("discovery_feed",   String(params.discovery_feed));
  if (params.skill_tag)                     q.set("skill_tag",        params.skill_tag);
  if (params.effort)                        q.set("effort",           params.effort);
  if (params.deadline_within)               q.set("deadline_within",  params.deadline_within);
  const qs = q.toString();
  return apiCall<TasksListResponse>(
    `/api/contributor/tasks${qs ? `?${qs}` : ""}`,
    { method: "GET", token, cache: "no-store" },
  );
}

// ── Tasks summary ────────────────────────────────────────────────────────────

export interface TasksSummary {
  available: number;
  in_progress: number;
  submitted: number;
  completed: number;
  rework: number;
  active_offers: number;
}

export async function fetchTasksSummary(
  token: string,
): Promise<TasksSummary> {
  return apiCall<TasksSummary>("/api/contributor/tasks/summary", {
    method: "GET",
    token,
    cache: "no-store",
  });
}

// ── Discovery summary ─────────────────────────────────────────────────────────

export interface DiscoverySummary {
  active_offers: number;
  server_time: string;
}

export async function fetchDiscoverySummary(
  token: string,
): Promise<DiscoverySummary> {
  return apiCall<DiscoverySummary>("/api/contributor/tasks/discovery/summary", {
    method: "GET",
    token,
    cache: "no-store",
  });
}

// ── Earnings summary ─────────────────────────────────────────────────────────

export interface EarningsSummary {
  total_earned: number;
  eligible: number;
  pending: number;
  processing: number;
  paid_out: number;
  currency: string;
  current_month: number;
  previous_month: number;
  lifetime_tasks_completed: number;
  average_per_task: number;
}

export async function fetchEarningsSummary(
  token: string,
): Promise<EarningsSummary> {
  return apiCall<EarningsSummary>("/api/contributor/earnings/summary", {
    method: "GET",
    token,
  });
}

export async function fetchEarningsOverview(token: string): Promise<string> {
  return apiCall<string>("/api/contributor/earnings/overview", {
    method: "GET",
    token,
  });
}

// ── Earnings list ─────────────────────────────────────────────────────────────

export interface EarningsListParams {
  status?: string;
  sort_by?: "task" | "amount" | "status" | "date";
  sort_dir?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

export async function fetchEarnings(
  token: string,
  params: EarningsListParams = {},
): Promise<string> {
  const q = new URLSearchParams();
  if (params.status) q.set("status", params.status);
  if (params.sort_by) q.set("sort_by", params.sort_by);
  if (params.sort_dir) q.set("sort_dir", params.sort_dir);
  if (params.page !== undefined) q.set("page", String(params.page));
  if (params.page_size !== undefined) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  return apiCall<string>(
    `/api/contributor/earnings${qs ? `?${qs}` : ""}`,
    { method: "GET", token, cache: "no-store" },
  );
}

// ── KYC status ───────────────────────────────────────────────────────────────

export async function fetchKycStatus(
  token: string,
  signal?: AbortSignal,
): Promise<string> {
  return apiCall<string>("/api/contributor/earnings/kyc/status", {
    method: "GET",
    token,
    cache: "no-store",
    ...(signal ? { signal } : {}),
  });
}

export async function startKyc(token: string): Promise<string> {
  return apiCall<string>("/api/contributor/earnings/kyc/start", {
    method: "POST",
    token,
  });
}

export async function fetchEarningById(
  token: string,
  earningId: string | number,
  signal?: AbortSignal,
): Promise<string> {
  return apiCall<string>(`/api/contributor/earnings/${encodeURIComponent(String(earningId))}`, {
    method: "GET",
    token,
    cache: "no-store",
    ...(signal ? { signal } : {}),
  });
}

export interface PayoutsListParams {
  status?: string | null;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

export async function fetchPayoutById(
  token: string,
  payoutId: string | number,
  signal?: AbortSignal,
): Promise<string> {
  return apiCall<string>(
    `/api/contributor/payouts/${encodeURIComponent(String(payoutId))}`,
    {
      method: "GET",
      token,
      cache: "no-store",
      ...(signal ? { signal } : {}),
    },
  );
}

export async function fetchPayoutReceipt(
  token: string,
  payoutId: string | number,
  signal?: AbortSignal,
): Promise<string> {
  return apiCall<string>(
    `/api/contributor/payouts/${encodeURIComponent(String(payoutId))}/receipt`,
    {
      method: "GET",
      token,
      cache: "no-store",
      ...(signal ? { signal } : {}),
    },
  );
}

export interface PayoutPreferences {
  preferred_method: string;
  minimum_payout_amount: string | number;
  auto_payout: boolean;
  account_name:   string | null;
  account_number: string | null;
  bank_name:      string | null;
  routing_code:   string | null;
  ifsc_code:      string | null;
  country:        string | null;
  provider:       string | null;
  phone_number:   string | null;
  paypal_email:   string | null;
  upi_id:         string | null;
  wallet_address: string | null;
  network:        string | null;
  token:          string | null;
}

export async function fetchPayoutPreferences(
  token: string,
  signal?: AbortSignal,
): Promise<PayoutPreferences> {
  return apiCall<PayoutPreferences>("/api/contributor/payout-preferences", {
    method: "GET",
    token,
    cache: "no-store",
    ...(signal ? { signal } : {}),
  });
}

export async function updatePayoutPreferences(
  token: string,
  body: Partial<PayoutPreferences> & { preferred_method: string },
): Promise<PayoutPreferences> {
  return apiCall<PayoutPreferences>("/api/contributor/payout-preferences", {
    method: "PUT",
    token,
    body: JSON.stringify(body),
  });
}

export async function fetchPayouts(
  token: string,
  params: PayoutsListParams = {},
  signal?: AbortSignal,
): Promise<string> {
  const q = new URLSearchParams();
  if (params.status && params.status !== "all") q.set("status", params.status);
  if (params.sort_by)  q.set("sort_by",   params.sort_by);
  if (params.sort_dir) q.set("sort_dir",  params.sort_dir);
  if (params.page)     q.set("page",      String(params.page));
  if (params.page_size) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  return apiCall<string>(`/api/contributor/payouts${qs ? `?${qs}` : ""}`, {
    method: "GET",
    token,
    cache: "no-store",
    ...(signal ? { signal } : {}),
  });
}

export type ChartPeriod = "3M" | "6m" | "1y";

export async function fetchEarningsChart(
  token: string,
  period: ChartPeriod,
): Promise<string> {
  return apiCall<string>(
    `/api/contributor/earnings/chart?period=${encodeURIComponent(period)}`,
    { method: "GET", token, cache: "no-store" },
  );
}

// ── Review feedback for a task ───────────────────────────────────────────────

export interface ReviewCriterion {
  criterion_id: string;
  score: number;
  max_score: number;
  comment: string;
}

export interface ReviewFeedback {
  task_id: string;
  submission_id: string;
  reviewer_feedback: string;
  review_score: number;
  rubric_score: number;
  criteria: ReviewCriterion[];
}

export async function fetchReviewFeedback(
  token: string,
  taskId: string,
  signal?: AbortSignal,
): Promise<ReviewFeedback> {
  const res = await fetchInternal(
    `/api/contributor/tasks/${encodeURIComponent(taskId)}/review-feedback`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      ...(signal ? { signal } : {}),
    },
  );

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail  = body?.detail ?? body?.message ?? `Error ${res.status}`;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
        ? detail
            .map(
              (e: { loc?: string[]; msg?: string }) =>
                `${e.loc?.slice(1).join(".") ?? "field"}: ${e.msg ?? "invalid"}`,
            )
            .join("; ")
        : JSON.stringify(detail);
    throw new ApiError(res.status, message);
  }

  return body as ReviewFeedback;
}

// ── Latest submission for a task ─────────────────────────────────────────────

export async function fetchLatestSubmission(
  token: string,
  taskId: string,
  signal?: AbortSignal,
): Promise<SubmissionDetail> {
  const res = await fetchInternal(
    `/api/contributor/tasks/${encodeURIComponent(taskId)}/latest-submission`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      ...(signal ? { signal } : {}),
    },
  );

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail  = body?.detail ?? body?.message ?? `Error ${res.status}`;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
        ? detail
            .map(
              (e: { loc?: string[]; msg?: string }) =>
                `${e.loc?.slice(1).join(".") ?? "field"}: ${e.msg ?? "invalid"}`,
            )
            .join("; ")
        : JSON.stringify(detail);
    throw new ApiError(res.status, message);
  }

  return body as SubmissionDetail;
}

// ── Resubmit submission ───────────────────────────────────────────────────────

export interface ResubmitPayload {
  notes?: string;
  file_ids?: string[];
  evidence_items?: CreateEvidenceItem[];
}

export async function resubmitSubmission(
  token: string,
  submissionId: string,
  payload: ResubmitPayload,
): Promise<SubmissionDetail> {
  const res = await fetchInternal(
    `/api/contributor/submissions/${encodeURIComponent(submissionId)}/resubmit`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail  = body?.detail ?? body?.message ?? `Error ${res.status}`;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
        ? detail
            .map(
              (e: { loc?: string[]; msg?: string }) =>
                `${e.loc?.slice(1).join(".") ?? "field"}: ${e.msg ?? "invalid"}`,
            )
            .join("; ")
        : JSON.stringify(detail);
    throw new ApiError(res.status, message);
  }

  return body as SubmissionDetail;
}

// ── Submissions list ──────────────────────────────────────────────────────────

export interface SubmissionItem {
  id: string;
  task_id: string;
  version: number;
  submitted_at: string;
  status: string;
}

export interface SubmissionsListResponse {
  items: SubmissionItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface SubmissionsListParams {
  status?: string;
  task_id?: string;
  page?: number;
  page_size?: number;
}

// ── Submission detail ─────────────────────────────────────────────────────────

export interface SubmissionFile {
  id: string;
  filename: string;
  mime_type: string;
}

export interface SubmissionEvidence {
  id: string;
  description: string;
  file_id: string;
  checklist_item_id: string;
  label?: string;
}

export interface ChecklistAcknowledgement {
  criteria_id: string;
  acknowledged: boolean;
}

export interface SubmissionDetail {
  id: string;
  task_id: string;
  version: number;
  submitted_at: string;
  status: string;
  notes: string;
  files: SubmissionFile[];
  evidence: SubmissionEvidence[];
  checklist_acknowledgements: ChecklistAcknowledgement[];
}

// ── Create submission ─────────────────────────────────────────────────────────

export interface CreateEvidenceItem {
  label?: string;
  description?: string;
  file_id?: string;
  url?: string;
  checklist_item_id?: string;
}

export interface CreateSubmissionPayload {
  submission_mode?: "draft" | "submit";
  version?: number;
  notes?: string;
  file_ids?: string[];
  evidence_items?: CreateEvidenceItem[];
  structured_response?: Record<string, unknown>;
}

export async function createSubmission(
  token: string,
  taskId: string,
  payload: CreateSubmissionPayload,
): Promise<SubmissionDetail> {
  /*
   * Routes through the Next.js layer so the 201 Created from the backend
   * is normalised to 200 and any demo-data 404 is handled gracefully.
   */
  const res = await fetchInternal(
    `/api/contributor/tasks/${encodeURIComponent(taskId)}/submissions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail = body?.detail ?? body?.message ?? `Error ${res.status}`;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
        ? detail
            .map(
              (e: { loc?: string[]; msg?: string }) =>
                `${e.loc?.slice(1).join(".") ?? "field"}: ${e.msg ?? "invalid"}`,
            )
            .join("; ")
        : JSON.stringify(detail);
    throw new ApiError(res.status, message);
  }

  return body as SubmissionDetail;
}

// ── Patch submission ──────────────────────────────────────────────────────────

export interface PatchEvidenceItem {
  label?: string;
  description?: string;
  file_id?: string;
  url?: string;
  checklist_item_id?: string;
}

export interface PatchChecklistAck {
  criterion_id: string;
  acknowledged: boolean;
  notes?: string;
}

export interface PatchSubmissionPayload {
  version?: number;
  notes?: string;
  file_ids?: string[];
  evidence_items?: PatchEvidenceItem[];
  structured_response?: Record<string, unknown>;
  checklist_acknowledgements?: PatchChecklistAck[];
}

export async function patchSubmission(
  token: string,
  submissionId: string,
  payload: PatchSubmissionPayload,
): Promise<SubmissionDetail> {
  /*
   * Route through the Next.js API layer (/api/contributor/submissions/[id])
   * so it can gracefully handle 404s from read-only demo submissions on the
   * real backend and still return a valid 200 with merged data.
   */
  const res = await fetchInternal(
    `/api/contributor/submissions/${encodeURIComponent(submissionId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail = body?.detail ?? body?.message ?? `Error ${res.status}`;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
        ? detail.map((e: { loc?: string[]; msg?: string }) => `${e.loc?.slice(1).join(".") ?? "field"}: ${e.msg ?? "invalid"}`).join("; ")
        : JSON.stringify(detail);
    throw new ApiError(res.status, message);
  }

  return body as SubmissionDetail;
}

export async function fetchSubmission(
  token: string,
  submissionId: string,
  signal?: AbortSignal,
): Promise<SubmissionDetail> {
  return apiCall<SubmissionDetail>(
    `/api/contributor/submissions/${encodeURIComponent(submissionId)}`,
    { method: "GET", token, cache: "no-store", ...(signal ? { signal } : {}) },
  );
}

export async function fetchSubmissions(
  token: string,
  params: SubmissionsListParams = {},
): Promise<SubmissionsListResponse> {
  const q = new URLSearchParams();
  if (params.status)                  q.set("status",    params.status);
  if (params.task_id)                 q.set("task_id",   params.task_id);
  if (params.page !== undefined)      q.set("page",      String(params.page));
  if (params.page_size !== undefined) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  return apiCall<SubmissionsListResponse>(
    `/api/contributor/submissions${qs ? `?${qs}` : ""}`,
    { method: "GET", token, cache: "no-store" },
  );
}

export interface DeactivateAccountPayload {
  confirmation_text: string;
  reason: string;
  password: string;
}

/**
 * Deactivates the contributor account.
 * The backend responds with 204 No Content on success (no body).
 */
export async function deactivateAccount(
  token: string,
  payload: DeactivateAccountPayload,
): Promise<void> {
  await apiCall<unknown>("/api/contributor/account/deactivate", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

// ── Message Threads ───────────────────────────────────────────────────────────

export interface MessageThreadItem {
  id: string;
  sender_name: string;
  sender_role: string;
  project_name?: string;
  task_title?: string;
  task_id?: string;
  last_message: string;
  timestamp: string;
  unread_count: number;
  avatar: string;
}

export interface MessageThreadsListResponse {
  items: MessageThreadItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface MessageParticipant {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export interface MessageItem {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  content: string;
  timestamp: string;
  attachment_id?: string;
  rating?: "up" | "down" | null;
}

export interface MessageThreadDetail {
  id: string;
  participants: MessageParticipant[];
  task_id?: string;
  project_name?: string;
  messages: MessageItem[];
}

export interface MessageThreadsParams {
  role?: string;
  q?: string;
  page?: number;
  page_size?: number;
}

export async function fetchMessageThreads(
  token: string,
  params: MessageThreadsParams = {},
): Promise<MessageThreadsListResponse> {
  const q = new URLSearchParams();
  if (params.role && params.role !== "all") q.set("role", params.role);
  if (params.q) q.set("q", params.q);
  if (params.page !== undefined) q.set("page", String(params.page));
  if (params.page_size !== undefined) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  return apiCall<MessageThreadsListResponse>(
    `/api/contributor/messages/threads${qs ? `?${qs}` : ""}`,
    { method: "GET", token, cache: "no-store" },
  );
}

export async function fetchMessageThread(
  token: string,
  threadId: string,
): Promise<MessageThreadDetail> {
  return apiCall<MessageThreadDetail>(
    `/api/contributor/messages/threads/${encodeURIComponent(threadId)}`,
    { method: "GET", token, cache: "no-store" },
  );
}

export async function postMessageToThread(
  token: string,
  threadId: string,
  content: string,
  attachment_ids?: string[],
): Promise<MessageItem> {
  return apiCall<MessageItem>(
    `/api/contributor/messages/threads/${encodeURIComponent(threadId)}/messages`,
    {
      method: "POST",
      token,
      body: JSON.stringify({ content, ...(attachment_ids ? { attachment_ids } : {}) }),
    },
  );
}

export async function markThreadRead(
  token: string,
  threadId: string,
): Promise<void> {
  await apiCall<unknown>(
    `/api/contributor/messages/threads/${encodeURIComponent(threadId)}/read`,
    { method: "POST", token },
  );
}

export async function rateThreadMessage(
  token: string,
  messageId: string,
  rating: "up" | "down",
): Promise<void> {
  await apiCall<unknown>(
    `/api/contributor/messages/${encodeURIComponent(messageId)}/rating`,
    {
      method: "POST",
      token,
      body: JSON.stringify({ rating }),
    },
  );
}

// ── Learning Recommendations ──────────────────────────────────────────────────

export interface LearningRecommendation {
  id: string;
  type: "task_based" | "skill_based" | string;
  title: string;
  skill: string;
  reason: string;
  estimated_hours: number;
  resource_url: string;
  related_task_id: string | null;
  priority: "high" | "medium" | "low" | string;
  recommended_at: string;
}

export interface LearningRecommendationsParams {
  type?: "task_based" | "skill_based";
  priority?: string;
  skill?: string;
}

export interface DismissRecommendationResponse {
  recommendation_id: string;
  dismissed: boolean;
}

export interface MarkOpenedRecommendationResponse {
  recommendation_id: string;
  opened: boolean;
}

export async function fetchLearningRecommendations(
  token: string,
  params: LearningRecommendationsParams = {},
): Promise<LearningRecommendation[]> {
  const q = new URLSearchParams();
  if (params.type) q.set("type", params.type);
  if (params.priority) q.set("priority", params.priority);
  if (params.skill) q.set("skill", params.skill);
  const qs = q.toString();
  return apiCall<LearningRecommendation[]>(
    `/api/contributor/learning/recommendations${qs ? `?${qs}` : ""}`,
    { method: "GET", token, cache: "no-store" },
  );
}

export async function dismissLearningRecommendation(
  token: string,
  recommendationId: string,
): Promise<DismissRecommendationResponse> {
  return apiCall<DismissRecommendationResponse>(
    `/api/contributor/learning/recommendations/${encodeURIComponent(recommendationId)}/dismiss`,
    { method: "POST", token },
  );
}

export async function markLearningRecommendationOpened(
  token: string,
  recommendationId: string,
): Promise<MarkOpenedRecommendationResponse> {
  return apiCall<MarkOpenedRecommendationResponse>(
    `/api/contributor/learning/recommendations/${encodeURIComponent(recommendationId)}/mark-opened`,
    { method: "POST", token },
  );
}

// ── Support Tickets ───────────────────────────────────────────────────────────

export interface SupportTicketItem {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SupportTicketsListResponse {
  items: SupportTicketItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface SupportTicketsParams {
  status?: string;
  priority?: string;
  category?: string;
  page?: number;
  page_size?: number;
}

export async function fetchSupportTickets(
  token: string,
  params: SupportTicketsParams = {},
): Promise<SupportTicketsListResponse> {
  const q = new URLSearchParams();
  if (params.status)    q.set("status",    params.status);
  if (params.priority)  q.set("priority",  params.priority);
  if (params.category)  q.set("category",  params.category);
  if (params.page !== undefined)      q.set("page",      String(params.page));
  if (params.page_size !== undefined) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  return apiCall<SupportTicketsListResponse>(
    `/api/contributor/support/tickets${qs ? `?${qs}` : ""}`,
    { method: "GET", token, cache: "no-store" },
  );
}

// ── Create Support Ticket ─────────────────────────────────────────────────────

export interface CreateSupportTicketPayload {
  subject: string;
  category: string;
  priority: string;
  description: string;
  attachment_ids?: string[];
  related_task_id?: string;
  related_project_id?: string;
}

export interface SupportTicketMessage {
  id: string;
  author: string;
  message: string;
  attachment_ids: string[];
  created_at: string;
}

export interface SupportTicketDetail {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  attachment_ids: string[];
  related_task_id: string | null;
  related_project_id: string | null;
  created_at: string;
  updated_at: string;
  messages: SupportTicketMessage[];
}

export async function createSupportTicket(
  token: string,
  payload: CreateSupportTicketPayload,
): Promise<SupportTicketDetail> {
  return apiCall<SupportTicketDetail>(
    "/api/contributor/support/tickets",
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    },
  );
}

export async function fetchSupportTicketDetail(
  token: string,
  ticketId: string,
): Promise<SupportTicketDetail> {
  return apiCall<SupportTicketDetail>(
    `/api/contributor/support/tickets/${encodeURIComponent(ticketId)}`,
    { method: "GET", token, cache: "no-store" },
  );
}

export type SupportTicketStatus = "open" | "in_progress" | "resolved" | "closed";

export async function updateSupportTicketStatus(
  token: string,
  ticketId: string,
  status: SupportTicketStatus,
): Promise<SupportTicketDetail> {
  return apiCall<SupportTicketDetail>(
    `/api/contributor/support/tickets/${encodeURIComponent(ticketId)}`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify({ status }),
    },
  );
}

export interface PostTicketMessagePayload {
  message: string;
  attachment_ids?: string[];
}

export async function postSupportTicketMessage(
  token: string,
  ticketId: string,
  payload: PostTicketMessagePayload,
): Promise<SupportTicketMessage> {
  return apiCall<SupportTicketMessage>(
    `/api/contributor/support/tickets/${encodeURIComponent(ticketId)}/messages`,
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    },
  );
}

// ── Support Grievances ────────────────────────────────────────────────────────

export interface GrievanceItem {
  id: string;
  category: string;
  subject: string;
  status: string;
  created_at: string;
  anonymous: boolean;
}

export interface GrievancesListResponse {
  items: GrievanceItem[];
  total: number;
}

export interface GrievanceDetail {
  id: string;
  category: string;
  subject: string;
  description: string;
  related_reference: string | null;
  anonymous: boolean;
  attachment_ids: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGrievancePayload {
  category: string;
  subject: string;
  description: string;
  related_reference?: string;
  anonymous: boolean;
  attachment_ids?: string[];
}

export async function fetchGrievances(
  token: string,
): Promise<GrievancesListResponse> {
  return apiCall<GrievancesListResponse>(
    "/api/contributor/support/grievances",
    { method: "GET", token, cache: "no-store" },
  );
}

export async function createGrievance(
  token: string,
  payload: CreateGrievancePayload,
): Promise<GrievanceDetail> {
  return apiCall<GrievanceDetail>(
    "/api/contributor/support/grievances",
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    },
  );
}

export async function fetchGrievanceDetail(
  token: string,
  grievanceId: string,
): Promise<GrievanceDetail> {
  return apiCall<GrievanceDetail>(
    `/api/contributor/support/grievances/${encodeURIComponent(grievanceId)}`,
    { method: "GET", token, cache: "no-store" },
  );
}

// ── Credentials ───────────────────────────────────────────────────────────────

// ── Credentials — Wallet Summary ─────────────────────────────────────────────

export interface CredentialsWalletSummary {
  total_credentials: number;
  skills_verified: number;
  tasks_accepted: number;
  acceptance_rate: number;
}

export async function fetchCredentialsWalletSummary(
  token: string,
): Promise<CredentialsWalletSummary> {
  return apiCall<CredentialsWalletSummary>(
    "/api/contributor/credentials/wallet/summary",
    { method: "GET", token },
  );
}

// ── Credentials — Wallet Cards ────────────────────────────────────────────────

export interface CredentialWalletCard {
  credential_id: string;
  credential_title: string;
  task_type: string;
  skill_tags: string[];
  designation: string;
  seniority: string;
  acceptance_date: string;
  quality_indicator: string;
  platform_verified: boolean;
  certificate_pdf_url: string;
  shareable_link: string;
}

export interface CredentialWalletCardsResponse {
  items: CredentialWalletCard[];
  page: number;
  page_size: number;
  total: number;
}

export interface CredentialWalletCardsParams {
  skill?: string;
  page?: number;
  page_size?: number;
}

export async function fetchCredentialWalletCards(
  token: string,
  params: CredentialWalletCardsParams = {},
): Promise<CredentialWalletCardsResponse> {
  const q = new URLSearchParams();
  if (params.skill)                   q.set("skill", params.skill);
  if (params.page !== undefined)      q.set("page", String(params.page));
  if (params.page_size !== undefined) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  return apiCall<CredentialWalletCardsResponse>(
    `/api/contributor/credentials/wallet/cards${qs ? `?${qs}` : ""}`,
    { method: "GET", token },
  );
}

// ── Credentials — Full List ───────────────────────────────────────────────────

export interface CredentialAcademicInfo {
  label: string;
  credits: number;
  course_code: string;
  [key: string]: unknown;
}

export interface CredentialListItem {
  id: string;
  title: string;
  skill: string;
  level: string;
  issued_at: string;
  task_id: string;
  task_title: string;
  project_title: string;
  pod_hash: string;
  verification_url: string;
  review_score: number;
  hours_validated: number;
  academic_mapping: CredentialAcademicInfo | null;
  skill_tags: string[];
  designation: string;
  seniority: string;
  acceptance_data: string;
  quality_indicator: string;
  platform_verified: boolean;
}

export interface CredentialsListResponse {
  items: CredentialListItem[];
  page?: number;
  page_size?: number;
  total?: number;
}

export type CredentialDateFilter = "30d" | "90d" | "6m";

export interface CredentialsListParams {
  skill?: string;
  date_filter?: CredentialDateFilter;
  page?: number;
  page_size?: number;
}

export async function fetchCredentialsList(
  token: string,
  params: CredentialsListParams = {},
): Promise<CredentialsListResponse> {
  const q = new URLSearchParams();
  if (params.skill)                   q.set("skill", params.skill);
  if (params.date_filter)             q.set("date_filter", params.date_filter);
  if (params.page !== undefined)      q.set("page", String(params.page));
  if (params.page_size !== undefined) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  return apiCall<CredentialsListResponse>(
    `/api/contributor/credentials${qs ? `?${qs}` : ""}`,
    { method: "GET", token },
  );
}

// ── Credentials — Skills Verification ────────────────────────────────────────

export interface SkillVerificationItem {
  skill_tag: string;
  status: string;
  credential_count: number;
  evidence_source: string;
  seniority_level: string;
}

export interface SkillVerificationResponse {
  items: SkillVerificationItem[];
}

export async function fetchSkillsVerification(
  token: string,
): Promise<SkillVerificationResponse> {
  return apiCall<SkillVerificationResponse>(
    "/api/contributor/credentials/skills/verification",
    { method: "GET", token },
  );
}

// ── Credentials — Per-credential Verification ─────────────────────────────────

export type CredentialVerificationData = Record<string, unknown>;

export async function fetchCredentialVerification(
  token: string,
  credentialId: string,
): Promise<CredentialVerificationData> {
  /* Use fetchInternal (Next.js proxy) to avoid CORS — server-to-server call */
  const path = `/api/contributor/credentials/${encodeURIComponent(credentialId)}/verification`;
  const res = await fetchInternal(path, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: `Error ${res.status}` }));
    throw new ApiError(
      res.status,
      (body as { detail?: string })?.detail ?? `Verification request failed (${res.status})`,
    );
  }

  return res.json().catch(() => ({})) as Promise<CredentialVerificationData>;
}

// ── Credentials — Detail ──────────────────────────────────────────────────────

export interface CredentialAcademicMapping {
  label: string;
  credits: number;
  course_code: string;
  [key: string]: unknown;
}

/*
 * Shape returned by GET /api/contributor/credentials/{credential_id}
 * Note: the response does NOT include `id` — use the credentialId from the URL path.
 */
export interface Credential {
  title: string;
  skill: string;
  level: string;
  issued_at: string;
  task_id: string;
  task_title: string;
  project_title: string;
  pod_hash: string;
  verification_url: string;
  review_score: number;
  hours_validated: number;
  certificate_file_url: string;
  academic_mapping: CredentialAcademicMapping | null;
  revoked: boolean;
  skill_tags: string[];
  designation: string;
  seniority: string;
  acceptance_date: string;
  quality_indicator: string;
  platform_verified: boolean;
}

export async function fetchCredentialDetail(
  token: string,
  credentialId: string,
): Promise<Credential> {
  return apiCall<Credential>(
    `/api/contributor/credentials/${encodeURIComponent(credentialId)}`,
    { method: "GET", token },
  );
}

/*
 * GET /api/contributor/credentials/{credential_id}/certificate
 *
 * Uses fetchInternal (Next.js proxy) instead of apiCall (direct backend)
 * to avoid CORS issues — the proxy makes server-to-server requests.
 *
 * Returns a URL string to open/download, or an empty string on failure.
 */
export async function fetchCredentialCertificate(
  token: string,
  credentialId: string,
  format = "pdf",
): Promise<string> {
  const path = `/api/contributor/credentials/${encodeURIComponent(credentialId)}/certificate?format=${encodeURIComponent(format)}`;

  const res = await fetchInternal(path, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json, application/pdf, */*",
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: `Certificate error ${res.status}` }));
    throw new ApiError(
      res.status,
      (body as { detail?: string })?.detail ?? `Certificate request failed (${res.status})`,
    );
  }

  const contentType = res.headers.get("content-type") ?? "";

  /* Binary PDF — create an object URL the caller can open/download */
  if (contentType.includes("application/pdf") || contentType.includes("octet-stream")) {
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }

  /* JSON-encoded string (URL or base64) */
  const text = await res.text();
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed === "string") return parsed;
    return "";
  } catch {
    /* Plain text — strip surrounding quotes if any */
    return text.trim().replace(/^"|"$/g, "");
  }
}

// ── Safety Reports ────────────────────────────────────────────────────────────

export interface CreateSafetyReportPayload {
  category: string;
  description: string;
  related_reference?: string;
  attachment_ids?: string[];
}

export interface SafetyReportDetail {
  id: string;
  category: string;
  description: string;
  related_reference: string | null;
  attachment_ids: string[];
  status: string;
  created_at: string;
}

export async function createSafetyReport(
  token: string,
  payload: CreateSafetyReportPayload,
): Promise<SafetyReportDetail> {
  return apiCall<SafetyReportDetail>(
    "/api/contributor/support/safety-reports",
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    },
  );
}

// ── Support FAQs ──────────────────────────────────────────────────────────────

export interface SupportFaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export interface SupportFaqsResponse {
  items: SupportFaqItem[];
  total: number;
}

export interface SupportFaqsParams {
  category?: string;
  q?: string;
}

export async function fetchSupportFaqs(
  token: string,
  params: SupportFaqsParams = {},
): Promise<SupportFaqsResponse> {
  const q = new URLSearchParams();
  if (params.category) q.set("category", params.category);
  if (params.q)        q.set("q", params.q);
  const qs = q.toString();
  return apiCall<SupportFaqsResponse>(
    `/api/contributor/support/faqs${qs ? `?${qs}` : ""}`,
    { method: "GET", token, cache: "no-store" },
  );
}

// ── Credentials — Share ────────────────────────────────────────────────────

export interface ShareCredentialRequest {
  target_type: string;
  target_id: string;
  consent: boolean;
  share_fields: string[];
}

export interface ShareCredentialResponse {
  credential_id: string;
  share_id: string;
  status: string;
  target_type: string;
  target_id: string;
  public_url: string;
}

export async function shareCredential(
  token: string,
  credentialId: string,
  payload: ShareCredentialRequest,
): Promise<ShareCredentialResponse> {
  const path = `/api/contributor/credentials/${encodeURIComponent(credentialId)}/share`;
  const res = await fetchInternal(path, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: `Error ${res.status}` }));
    throw new ApiError(
      res.status,
      (body as { detail?: string })?.detail ?? `Share request failed (${res.status})`,
    );
  }

  return res.json() as Promise<ShareCredentialResponse>;
}

// ── Credentials — Academic Portfolio ──────────────────────────────────────

export interface AcademicPortfolioRequest {
  format: string;
  include_tasks: boolean;
  include_credentials: boolean;
  include_hours: boolean;
  include_feedback: boolean;
}

export interface AcademicPortfolioResponse {
  credential_id: string;
  format: string;
  download_url: string;
  job_id: string;
}

export async function createAcademicPortfolio(
  token: string,
  credentialId: string,
  payload: AcademicPortfolioRequest,
): Promise<AcademicPortfolioResponse> {
  const path = `/api/contributor/credentials/${encodeURIComponent(credentialId)}/academic-portfolio`;
  const res = await fetchInternal(path, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: `Error ${res.status}` }));
    throw new ApiError(
      res.status,
      (body as { detail?: string })?.detail ?? `Academic portfolio request failed (${res.status})`,
    );
  }

  return res.json() as Promise<AcademicPortfolioResponse>;
}

// ── Contributor profile & digital twin ────────────────────────────────────
/*
 * Exposes GET /api/contributor/profile and GET /api/contributor/profile/digital-twin
 * via the Next.js proxy. Backend responses may be snake_case; mappers below normalize
 * to the shapes the profile UI was built for.
 */

export interface ContributorProfileSkillApi {
  name: string;
  proficiency?: string;
  source?: string;
  validated_count?: number;
  evidence_count?: number;
  last_validated_at?: string;
}

export interface ContributorProfileResponse {
  id?: string;
  display_name?: string;
  email?: string;
  phone?: string;
  anonymous_id?: string;
  avatar?: string;
  track?: string;
  verification_status?: string;
  joined_at?: string;
  profile_completeness?: number;
  timezone?: string;
  weekly_hours?: number;
  availability?: string;
  language?: string;
  bio?: string;
  country?: string;
  city?: string;
  skills?: ContributorProfileSkillApi[];
  // Signup-time fields (returned by backend, surfaced in Personal Details).
  date_of_birth?: string | null;
  department_category?: string | null;
  department_other?: string | null;
  degree?: string | null;
  linkedin?: string | null;
  primary_skills?: string[] | null;
  secondary_skills?: string[] | null;
  other_skills?: string[] | null;
  [key: string]: unknown;
}

/** Request body for PATCH /api/contributor/profile (OpenAPI) */
export interface PatchContributorProfileBody {
  display_name: string;
  bio: string;
  phone: string;
  country: string;
  city: string;
  timezone: string;
  weekly_hours: number;
  availability: string;
  language: string;
}

function profileHeaders(
  token: string,
  contributorId: string,
  extra?: Record<string, string>,
) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-Contributor-Id": contributorId,
    ...extra,
  };
}

export type ProfileUiSkill = {
  name: string;
  proficiency: string;
  source: string;
  validatedCount: number;
  evidenceCount: number;
  lastValidatedAt?: string;
};

export type ProfileUiState = {
  id: string;
  displayName: string;
  anonymousId: string;
  avatar: string;
  email: string;
  track: string;
  joinedAt: string;
  profileCompleteness: number;
  timezone: string;
  weeklyHours: number;
  availability: string;
  skills: ProfileUiSkill[];
  // Signup-time fields surfaced in Personal Details.
  country?: string;
  phone?: string;
  dob?: string | null;
  departmentCategory?: string | null;
  departmentOther?: string | null;
  degree?: string | null;
  linkedin?: string | null;
  primarySkills: string[];
  secondarySkills: string[];
  otherSkills: string[];
};

export function mapContributorProfileToUi(
  raw: ContributorProfileResponse,
  fallbacks: { displayName: string; email: string; avatar: string },
): ProfileUiState {
  const toProf = (p?: string) => {
    const v = (p ?? "intermediate").toLowerCase();
    if (v === "beginner" || v === "intermediate" || v === "advanced" || v === "expert") return v;
    return "intermediate";
  };
  const toSource = (s?: string) => {
    const n = (s ?? "").toLowerCase().replace(/-/g, "_");
    return n === "delivery_validated" ? "delivery_validated" : "self_declared";
  };

  return {
    id: String(raw.id ?? ""),
    displayName: String(raw.display_name ?? fallbacks.displayName),
    anonymousId: String(raw.anonymous_id ?? ""),
    avatar: String(raw.avatar ?? fallbacks.avatar),
    email: String(raw.email ?? fallbacks.email),
    track: String(raw.track ?? "general").toLowerCase() || "general",
    joinedAt: String(raw.joined_at ?? ""),
    profileCompleteness: Math.max(0, Math.min(100, Number(raw.profile_completeness ?? 0))),
    timezone: String(raw.timezone ?? "—"),
    weeklyHours: Number(raw.weekly_hours ?? 0),
    availability: String(raw.availability ?? "available").toLowerCase() || "available",
    skills: (raw.skills ?? []).map((sk) => ({
      name: String(sk.name ?? ""),
      proficiency: toProf(sk.proficiency),
      source: toSource(sk.source),
      validatedCount: Number(sk.validated_count ?? 0),
      evidenceCount: Number(sk.evidence_count ?? 0),
      lastValidatedAt: sk.last_validated_at,
    })),
    country: raw.country,
    phone: raw.phone,
    dob: raw.date_of_birth,
    departmentCategory: raw.department_category,
    departmentOther: raw.department_other,
    degree: raw.degree,
    linkedin: raw.linkedin,
    primarySkills: raw.primary_skills ?? [],
    secondarySkills: raw.secondary_skills ?? [],
    otherSkills: raw.other_skills ?? [],
  };
}

export function isAvatarImageUrl(avatar: string) {
  return /^https?:\/\//i.test(avatar?.trim() ?? "");
}

export async function fetchContributorProfile(
  token: string,
  contributorId: string,
): Promise<ContributorProfileResponse> {
  const res = await fetchInternal("/api/contributor/profile", {
    method: "GET",
    headers: profileHeaders(token, contributorId),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: `Error ${res.status}` }));
    throw new ApiError(
      res.status,
      (body as { detail?: string })?.detail ?? `Profile request failed (${res.status})`,
    );
  }
  return res.json() as Promise<ContributorProfileResponse>;
}

export async function patchContributorProfile(
  token: string,
  contributorId: string,
  body: PatchContributorProfileBody,
): Promise<ContributorProfileResponse> {
  const res = await fetchInternal("/api/contributor/profile", {
    method: "PATCH",
    headers: profileHeaders(token, contributorId),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({ detail: `Error ${res.status}` }));
    throw new ApiError(
      res.status,
      (errJson as { detail?: string })?.detail ?? `Profile update failed (${res.status})`,
    );
  }
  return res.json() as Promise<ContributorProfileResponse>;
}

/** Request body for PUT /api/contributor/profile/skills */
export interface PutContributorProfileSkillsBody {
  skills: Array<{ name: string; proficiency: string }>;
}

/**
 * Replace contributor skills. Returns 200 with full profile (OpenAPI), same shape as GET /profile.
 */
export async function putContributorProfileSkills(
  token: string,
  contributorId: string,
  body: PutContributorProfileSkillsBody,
): Promise<ContributorProfileResponse> {
  const res = await fetchInternal("/api/contributor/profile/skills", {
    method: "PUT",
    headers: profileHeaders(token, contributorId),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({ detail: `Error ${res.status}` }));
    throw new ApiError(
      res.status,
      (errJson as { detail?: string })?.detail ?? `Skills update failed (${res.status})`,
    );
  }
  return res.json() as Promise<ContributorProfileResponse>;
}

// ── Profile evidence list ─────────────────────────────────────────────────

export interface ProfileEvidenceSkillRow {
  name: string;
  proficiency?: string;
}

export interface ProfileEvidenceItemApi {
  id: string;
  title: string;
  type: string;
  url?: string;
  file_id?: string;
  description?: string;
  skills?: ProfileEvidenceSkillRow[];
}

export interface ProfileEvidenceListResponse {
  items: ProfileEvidenceItemApi[];
  total: number;
}

export interface ProfileEvidenceQueryParams {
  q?: string;
  type?: string;
  skill?: string;
}

export async function fetchContributorProfileEvidence(
  token: string,
  contributorId: string,
  params: ProfileEvidenceQueryParams = {},
): Promise<ProfileEvidenceListResponse> {
  const q = new URLSearchParams();
  if (params.q?.trim()) q.set("q", params.q.trim());
  if (params.type?.trim()) q.set("type", params.type.trim());
  if (params.skill?.trim()) q.set("skill", params.skill.trim());
  const qs = q.toString();
  const path = `/api/contributor/profile/evidence${qs ? `?${qs}` : ""}`;
  const res = await fetchInternal(path, {
    method: "GET",
    headers: profileHeaders(token, contributorId),
  });
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({ detail: `Error ${res.status}` }));
    throw new ApiError(
      res.status,
      (errJson as { detail?: string })?.detail ?? `Evidence list failed (${res.status})`,
    );
  }
  return res.json() as Promise<ProfileEvidenceListResponse>;
}

/** Body for POST /api/contributor/profile/evidence (OpenAPI) */
export interface CreateProfileEvidenceBody {
  title: string;
  type: string;
  url: string;
  file_id: string;
  description: string;
  skills: Array<{ name: string; proficiency: string }>;
}

function evidenceApiErrorMessage(errJson: { detail?: unknown }, fallback: string) {
  const fromDetail = (() => {
    const detail = errJson?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((e: { loc?: unknown[]; msg?: string }) => `${e.msg ?? "invalid"}`)
        .join("; ");
    }
    return "";
  })();
  return fromDetail || fallback;
}

/**
 * Create evidence; backend returns 201 (or 200) with the created item.
 */
export async function createContributorProfileEvidence(
  token: string,
  contributorId: string,
  body: CreateProfileEvidenceBody,
): Promise<ProfileEvidenceItemApi> {
  const res = await fetchInternal("/api/contributor/profile/evidence", {
    method: "POST",
    headers: profileHeaders(token, contributorId),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({ detail: `Error ${res.status}` }));
    throw new ApiError(
      res.status,
      evidenceApiErrorMessage(errJson as { detail?: unknown }, `Create evidence failed (${res.status})`),
    );
  }
  return res.json() as Promise<ProfileEvidenceItemApi>;
}

/** Optional fields for PATCH /api/contributor/profile/evidence/{evidence_id} (OpenAPI) */
export type UpdateProfileEvidenceBody = Partial<CreateProfileEvidenceBody>;

/**
 * Update evidence; backend returns 200 with the updated item.
 */
export async function updateContributorProfileEvidence(
  token: string,
  contributorId: string,
  evidenceId: string,
  body: UpdateProfileEvidenceBody,
): Promise<ProfileEvidenceItemApi> {
  const path = `/api/contributor/profile/evidence/${encodeURIComponent(evidenceId)}`;
  const res = await fetchInternal(path, {
    method: "PATCH",
    headers: profileHeaders(token, contributorId),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({ detail: `Error ${res.status}` }));
    throw new ApiError(
      res.status,
      evidenceApiErrorMessage(errJson as { detail?: unknown }, `Update evidence failed (${res.status})`),
    );
  }
  return res.json() as Promise<ProfileEvidenceItemApi>;
}

/**
 * Delete evidence; backend returns 200 (JSON or plain string in OpenAPI).
 */
export async function deleteContributorProfileEvidence(
  token: string,
  contributorId: string,
  evidenceId: string,
): Promise<unknown> {
  const path = `/api/contributor/profile/evidence/${encodeURIComponent(evidenceId)}`;
  const res = await fetchInternal(path, {
    method: "DELETE",
    headers: profileHeaders(token, contributorId),
  });
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({ detail: `Error ${res.status}` }));
    throw new ApiError(
      res.status,
      evidenceApiErrorMessage(errJson as { detail?: unknown }, `Delete evidence failed (${res.status})`),
    );
  }
  const text = await res.text();
  if (!text.trim()) return { ok: true };
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export interface DigitalTwinTopSkillApi {
  skill: string;
  tasks_completed?: number;
  avg_score?: number;
}

export interface ContributorDigitalTwinResponse {
  updated_at?: string;
  tasks_completed?: number;
  total_submissions?: number;
  acceptance_rate?: number;
  on_time_delivery?: number;
  sla_compliance?: number;
  average_review_score?: number;
  total_hours_logged?: number;
  average_hours_per_task?: number;
  skill_growth_rate?: number;
  skill_growth_per_quarter?: number;
  rework_rate?: number;
  streak_days?: number;
  longest_streak?: number;
  top_skills?: DigitalTwinTopSkillApi[];
  monthly_activity?: Array<{ month: string; tasks_completed: number; hours_logged: number; earned: number }>;
  ai_insights?: string[];
  strengths?: string[];
  growth_areas?: string[];
  performance_trend?: string;
  [key: string]: unknown;
}

export type DigitalTwinUi = {
  contributorId: string;
  updatedAt: string;
  tasksCompleted: number;
  totalSubmissions: number;
  acceptanceRate: number;
  onTimeDelivery: number;
  slaCompliance: number;
  averageReviewScore: number;
  totalHoursLogged: number;
  averageHoursPerTask: number;
  skillGrowthRate: number;
  skillGrowthPerQuarter: number;
  reworkRate: number;
  streakDays: number;
  longestStreak: number;
  topSkills: Array<{ skill: string; tasksCompleted: number; avgScore: number }>;
  monthlyActivity: Array<{ month: string; tasksCompleted: number; hoursLogged: number; earned: number }>;
  aiInsights: string[];
  strengths: string[];
  growthAreas: string[];
  performanceTrend: string;
};

const EMPTY_TWIN: DigitalTwinUi = {
  contributorId: "",
  updatedAt: "",
  tasksCompleted: 0,
  totalSubmissions: 0,
  acceptanceRate: 0,
  onTimeDelivery: 0,
  slaCompliance: 0,
  averageReviewScore: 0,
  totalHoursLogged: 0,
  averageHoursPerTask: 0,
  skillGrowthRate: 0,
  skillGrowthPerQuarter: 0,
  reworkRate: 0,
  streakDays: 0,
  longestStreak: 0,
  topSkills: [],
  monthlyActivity: [],
  aiInsights: [],
  strengths: [],
  growthAreas: [],
  performanceTrend: "improving",
};

export function mapDigitalTwinToUi(raw: ContributorDigitalTwinResponse | null | undefined): DigitalTwinUi {
  if (!raw || typeof raw !== "object") return { ...EMPTY_TWIN };
  return {
    contributorId: String((raw as { contributor_id?: string }).contributor_id ?? ""),
    updatedAt: String(raw.updated_at ?? ""),
    tasksCompleted: Number(raw.tasks_completed ?? 0),
    totalSubmissions: Number(raw.total_submissions ?? 0),
    acceptanceRate: Number(raw.acceptance_rate ?? 0),
    onTimeDelivery: Number(raw.on_time_delivery ?? 0),
    slaCompliance: Number(raw.sla_compliance ?? 0),
    averageReviewScore: Number(raw.average_review_score ?? 0),
    totalHoursLogged: Number(raw.total_hours_logged ?? 0),
    averageHoursPerTask: Number(raw.average_hours_per_task ?? 0),
    skillGrowthRate: Number(raw.skill_growth_rate ?? 0),
    skillGrowthPerQuarter: Number(
      raw.skill_growth_per_quarter ?? raw.skill_growth_rate ?? 0,
    ),
    reworkRate: Number(raw.rework_rate ?? 0),
    streakDays: Number(raw.streak_days ?? 0),
    longestStreak: Number(raw.longest_streak ?? 0),
    topSkills: (raw.top_skills ?? []).map((t) => {
      const x = t as unknown as Record<string, unknown>;
      return {
        skill: String(x.skill ?? x.name ?? ""),
        tasksCompleted: Number(x.tasks_completed ?? x.tasks ?? 0),
        avgScore: Number(x.avg_score ?? x.score ?? 0),
      };
    }),
    monthlyActivity: (raw.monthly_activity ?? []).map((m) => {
      const x = m as Record<string, unknown>;
      return {
        month: String(x.month ?? ""),
        tasksCompleted: Number(x.tasks_completed ?? x.tasks ?? 0),
        hoursLogged: Number(x.hours_logged ?? x.hours ?? 0),
        earned: Number(x.earned ?? 0),
      };
    }),
    aiInsights: (raw.ai_insights ?? []) as string[],
    strengths: (raw.strengths ?? []) as string[],
    growthAreas: (raw.growth_areas ?? []) as string[],
    performanceTrend: String(
      (raw.performance_trend ?? "improving").toLowerCase(),
    ),
  };
}

export async function fetchContributorDigitalTwin(
  token: string,
  contributorId: string,
): Promise<ContributorDigitalTwinResponse> {
  const res = await fetchInternal("/api/contributor/profile/digital-twin", {
    method: "GET",
    headers: profileHeaders(token, contributorId),
  });
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({ detail: `Error ${res.status}` }));
    throw new ApiError(
      res.status,
      evidenceApiErrorMessage(errJson as { detail?: unknown }, `Digital twin request failed (${res.status})`),
    );
  }
  return res.json() as Promise<ContributorDigitalTwinResponse>;
}

/** OpenAPI: GET /api/contributor/profile/digital-twin/history?period=3m|6m|1y */
export type DigitalTwinHistoryPeriod = "3m" | "6m" | "1y";

export interface DigitalTwinHistoryResponse {
  period?: string;
  snapshots?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export async function fetchContributorDigitalTwinHistory(
  token: string,
  contributorId: string,
  period: DigitalTwinHistoryPeriod = "3m",
): Promise<DigitalTwinHistoryResponse> {
  const q = new URLSearchParams();
  q.set("period", period);
  const path = `/api/contributor/profile/digital-twin/history?${q.toString()}`;
  const res = await fetchInternal(path, {
    method: "GET",
    headers: profileHeaders(token, contributorId),
  });
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({ detail: `Error ${res.status}` }));
    throw new ApiError(
      res.status,
      evidenceApiErrorMessage(
        errJson as { detail?: unknown },
        `Digital twin history request failed (${res.status})`,
      ),
    );
  }
  return res.json() as Promise<DigitalTwinHistoryResponse>;
}

// ── Public Credentials (unauthenticated share link) ────────────────────────

export interface PublicCredential {
  task_type: string;
  skills_evidenced: string[];
  designation: string;
  seniority: string;
  quality_indicator: string;
  platform_verified: boolean;
}

export async function fetchPublicCredential(shareId: string): Promise<PublicCredential> {
  /* No auth token — public endpoint routed through Next.js proxy */
  const path = `/api/public/credentials/${encodeURIComponent(shareId)}`;
  const res = await fetchInternal(path, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: `Error ${res.status}` }));
    throw new ApiError(
      res.status,
      (body as { detail?: string })?.detail ?? `Public credential request failed (${res.status})`,
    );
  }

  return res.json() as Promise<PublicCredential>;
}

// ── Contributor universal search ─────────────────────────────────────────────

export type ContributorSearchResultType = "task" | "learning" | "submission";

export interface ContributorSearchResult {
  type: ContributorSearchResultType;
  id: string;
  title: string;
  subtitle: string | null;
  url: string | null;
  score: number;
}

export interface ContributorSearchResponse {
  query: string;
  total: number;
  results: ContributorSearchResult[];
}

export async function searchContributor(
  token: string,
  contributorId: string,
  query: string,
  options?: { limit?: number; signal?: AbortSignal },
): Promise<ContributorSearchResponse> {
  const limit = options?.limit ?? 20;
  const path = `/api/contributor/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await fetchInternal(path, {
    method: "GET",
    headers: profileHeaders(token, contributorId),
    signal: options?.signal,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: `Error ${res.status}` }));
    throw new ApiError(
      res.status,
      (body as { detail?: string })?.detail ?? `Search failed (${res.status})`,
    );
  }
  return res.json() as Promise<ContributorSearchResponse>;
}
