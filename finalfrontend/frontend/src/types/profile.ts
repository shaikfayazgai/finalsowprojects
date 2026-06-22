/**
 * Enterprise operator profile v3 types.
 *
 * The profile surface is mostly read-only and derives its data from the
 * contributor task store + delivery store. The profile *store* persists
 * the editable identity fields (display name, contact prefs, etc.).
 */

export type OperatorRoleKey =
  | "enterprise_admin"
  | "enterprise_reviewer"
  | "enterprise_operator"
  | "enterprise_observer";

export interface OperatorIdentity {
  displayName: string;
  initials: string;
  email: string;
  phone?: string;
  title: string;
  department: string;
  timezone: string;
  /** Joined the workspace at (ISO). */
  joinedAt: string;
  /** Role determines surface access and capabilities. */
  role: OperatorRoleKey;
}

export interface ScopeOfAuthority {
  /** Maximum line value the operator can accept without cosign. */
  acceptanceCeiling: number;
  /** Whether the operator can release governance holds without cosign. */
  canReleaseHolds: boolean;
  /** Whether the operator can override SLA windows. */
  canOverrideSla: boolean;
  /** Surfaces the operator has full access to. */
  fullAccessSurfaces: ProfileSurface[];
  /** Surfaces the operator has read-only access to. */
  readOnlySurfaces: ProfileSurface[];
}

export type ProfileSurface =
  | "review"
  | "delivery_tracking"
  | "billing"
  | "sow"
  | "decomposition"
  | "projects"
  | "reviewer"
  | "settings";

export type DecisionAction =
  | "accepted"
  | "reworked"
  | "rejected"
  | "escalated"
  | "approved_sow"
  | "released_hold";

export interface DecisionRecord {
  id: string;
  /** When the decision was made (ISO). */
  decidedAt: string;
  action: DecisionAction;
  /** What the decision was on. */
  subject: string;
  /** Which surface the decision happened on. */
  surface: ProfileSurface;
  /** Optional related task id for deep-link. */
  taskId?: string;
  /** Optional outcome chip. */
  outcome?: string;
  /** Optional notes from the operator. */
  note?: string;
}

export interface InterventionSummaryRow {
  id: string;
  at: string;
  kind:
    | "reassigned"
    | "sla_overridden"
    | "convened"
    | "held"
    | "released"
    | "escalated"
    | "withdrawn";
  subject: string;
  surface: ProfileSurface;
  taskId?: string;
  cosignActor?: string;
  note?: string;
}

export interface ProfileActivityEvent {
  id: string;
  at: string;
  kind:
    | "decision"
    | "intervention"
    | "settings"
    | "session"
    | "comment"
    | "view";
  title: string;
  detail: string;
  surface?: ProfileSurface;
  taskId?: string;
  tone: "info" | "success" | "warning" | "neutral";
}

export interface PermissionEntry {
  surface: ProfileSurface;
  label: string;
  /** Granted capabilities (read, write, approve, escalate, …). */
  capabilities: PermissionCapability[];
  /** Whether the surface is fully accessible. */
  level: "full" | "read_only" | "blocked";
}

export type PermissionCapability =
  | "read"
  | "write"
  | "approve"
  | "reassign"
  | "escalate"
  | "release_hold"
  | "override_sla"
  | "export";

export interface ProfileEditableState {
  displayName: string;
  phone: string;
  title: string;
  department: string;
  timezone: string;
  initials: string;
  /** Color slot for the avatar tile. */
  avatarColor: "brand" | "violet" | "teal" | "amber" | "rose";
  /** Operator's personal bio / about-me line. */
  bio: string;
}

/** Canonical avatar swatch colors, shared by banner + edit dialog. */
export const AVATAR_COLOR_HEX: Record<
  ProfileEditableState["avatarColor"],
  string
> = {
  brand: "var(--color-brand)",
  violet: "#7c5cff",
  teal: "#0f9b9b",
  amber: "#e08a00",
  rose: "#d04267",
};

/**
 * Profile is a single-page surface per spec
 * (docs/architecture/ENTERPRISE_PORTAL_V2_REORGANIZATION.md §3 · §7).
 * Kept as a 1-entry list so any residual lookups still resolve.
 */
export const PROFILE_TABS = [
  { id: "overview", label: "Overview", href: "/enterprise/profile" },
] as const;

export type ProfileTabId = (typeof PROFILE_TABS)[number]["id"];

export const ROLE_LABEL: Record<OperatorRoleKey, string> = {
  enterprise_admin: "Enterprise admin",
  enterprise_reviewer: "Enterprise reviewer",
  enterprise_operator: "Enterprise operator",
  enterprise_observer: "Enterprise observer",
};

export const SURFACE_LABEL: Record<ProfileSurface, string> = {
  review: "Review",
  delivery_tracking: "Delivery tracking",
  billing: "Billing",
  sow: "SOW",
  decomposition: "Decomposition",
  projects: "Projects",
  reviewer: "Reviewer workspace",
  settings: "Settings",
};

export const DEFAULT_OPERATOR_IDENTITY: OperatorIdentity = {
  displayName: "Enterprise operator",
  initials: "EO",
  email: "operator@glimmora.ai",
  title: "Director of operations",
  department: "Enterprise governance",
  timezone: "Asia/Kolkata",
  joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
  role: "enterprise_admin",
};

export const DEFAULT_SCOPE: ScopeOfAuthority = {
  acceptanceCeiling: 250000,
  canReleaseHolds: true,
  canOverrideSla: true,
  fullAccessSurfaces: [
    "review",
    "delivery_tracking",
    "billing",
    "sow",
    "decomposition",
    "projects",
    "settings",
  ],
  readOnlySurfaces: ["reviewer"],
};

export const DEFAULT_PROFILE_EDITABLE: ProfileEditableState = {
  displayName: "Enterprise operator",
  phone: "",
  title: "Director of operations",
  department: "Enterprise governance",
  timezone: "Asia/Kolkata",
  initials: "EO",
  avatarColor: "brand",
  bio:
    "Enterprise governance operator. Reviews acceptance decisions, releases holds, and keeps cross-role propagation flowing.",
};
