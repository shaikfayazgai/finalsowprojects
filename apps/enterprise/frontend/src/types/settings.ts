/**
 * Enterprise Settings v3 types — operator preferences, notification
 * routing, integrations, branding, compliance, and API tokens.
 *
 * All persisted via `useSettingsStoreV3` (zustand + localStorage).
 */

export type AiPosture = "minimal" | "balanced" | "verbose";
export type ConfidenceFilter = "all" | "medium_high" | "high_only";
export type LandingSurface =
  | "dashboard"
  | "review"
  | "delivery_tracking"
  | "billing"
  | "sow";
export type Density = "comfortable" | "compact";
export type DisplayMode = "system" | "light" | "dark";

export interface PreferencesState {
  // Governance posture
  requireDoubleAccept: boolean;
  minReadinessScore: number;
  maxRoundsBeforeEscalation: number;

  // SLA pressure surfacing
  slaWatchHours: number;
  slaBreachHours: number;

  // Review visibility
  showReviewerRecommendations: boolean;
  showAiSignals: boolean;
  showAuditTrail: boolean;

  // AI assistance
  aiPostureLevel: AiPosture;
  aiConfidenceFilter: ConfidenceFilter;

  // Workspace defaults
  defaultLandingSurface: LandingSurface;
  density: Density;
}

export type NotificationKind =
  | "acceptance"
  | "escalation"
  | "billing_ready"
  | "sla_breach"
  | "mentor_revisit"
  | "mention"
  | "approval"
  | "digest";

export type NotificationChannel = "in_app" | "email" | "slack" | "digest";

export type NotificationCadence = "instant" | "hourly" | "daily" | "off";

export interface NotificationRoutingRule {
  kind: NotificationKind;
  channels: Record<NotificationChannel, boolean>;
  cadence: NotificationCadence;
  muted: boolean;
}

export interface NotificationRoutingState {
  rules: Record<NotificationKind, NotificationRoutingRule>;
  doNotDisturb: {
    enabled: boolean;
    startHour: number;
    endHour: number;
  };
}

export type IntegrationKind = "slack" | "teams" | "webhook" | "github" | "linear";

export type IntegrationStatus = "connected" | "disconnected" | "pending" | "error";

export interface IntegrationRecord {
  id: string;
  kind: IntegrationKind;
  label: string;
  status: IntegrationStatus;
  detail?: string;
  connectedAt?: string;
  scopes?: string[];
}

export interface ApiToken {
  id: string;
  label: string;
  preview: string;
  createdAt: string;
  lastUsedAt?: string;
  scopes: string[];
}

export interface BrandingState {
  workspaceName: string;
  accentColor: "default" | "brand" | "violet" | "teal" | "amber";
  displayMode: DisplayMode;
  density: Density;
  logoLabel: string;
}

export interface ComplianceState {
  /** Days to retain audit data before archival. */
  auditRetentionDays: number;
  /** Days to retain delivery activity events. */
  activityRetentionDays: number;
  /** Whether export approvals require dual sign-off. */
  exportRequiresCosign: boolean;
  /** Manual export jobs that have been triggered. */
  exports: ComplianceExportJob[];
}

export interface ComplianceExportJob {
  id: string;
  kind: "audit" | "activity" | "deliveries" | "billing";
  range: "30d" | "90d" | "ytd" | "all";
  requestedAt: string;
  requestedBy: string;
  status: "queued" | "running" | "ready" | "failed";
}

export const SETTINGS_TABS = [
  /**
   * Settings is 2-route per spec (docs/architecture/ENTERPRISE_PORTAL_V2_REORGANIZATION.md §7):
   * "keep Settings to profile + security + basic preferences".
   * Deep customization (notifications · integrations · branding · compliance ·
   * API tokens) is explicitly Phase 2.
   */
  { id: "preferences", label: "Preferences", href: "/enterprise/settings" },
  { id: "security", label: "Security", href: "/enterprise/settings/security" },
] as const;

export type SettingsTabId = (typeof SETTINGS_TABS)[number]["id"];

export const DEFAULT_PREFERENCES: PreferencesState = {
  requireDoubleAccept: false,
  minReadinessScore: 80,
  maxRoundsBeforeEscalation: 3,
  slaWatchHours: 24,
  slaBreachHours: 48,
  showReviewerRecommendations: true,
  showAiSignals: true,
  showAuditTrail: true,
  aiPostureLevel: "balanced",
  aiConfidenceFilter: "all",
  defaultLandingSurface: "dashboard",
  density: "comfortable",
};

export const DEFAULT_BRANDING: BrandingState = {
  workspaceName: "GlimmoraTeam",
  accentColor: "default",
  displayMode: "system",
  density: "comfortable",
  logoLabel: "GT",
};

export const DEFAULT_COMPLIANCE: ComplianceState = {
  auditRetentionDays: 365,
  activityRetentionDays: 180,
  exportRequiresCosign: true,
  exports: [],
};

const DEFAULT_RULE = (kind: NotificationKind): NotificationRoutingRule => ({
  kind,
  channels: { in_app: true, email: false, slack: false, digest: true },
  cadence: "instant",
  muted: false,
});

export const DEFAULT_NOTIFICATION_ROUTING: NotificationRoutingState = {
  rules: {
    acceptance: DEFAULT_RULE("acceptance"),
    escalation: { ...DEFAULT_RULE("escalation"), channels: { in_app: true, email: true, slack: false, digest: true } },
    billing_ready: DEFAULT_RULE("billing_ready"),
    sla_breach: { ...DEFAULT_RULE("sla_breach"), channels: { in_app: true, email: true, slack: false, digest: true } },
    mentor_revisit: { ...DEFAULT_RULE("mentor_revisit"), cadence: "hourly" },
    mention: DEFAULT_RULE("mention"),
    approval: { ...DEFAULT_RULE("approval"), channels: { in_app: true, email: true, slack: false, digest: true } },
    digest: { ...DEFAULT_RULE("digest"), cadence: "daily" },
  },
  doNotDisturb: { enabled: false, startHour: 22, endHour: 7 },
};
