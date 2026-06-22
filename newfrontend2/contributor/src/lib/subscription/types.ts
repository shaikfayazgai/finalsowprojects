/**
 * Tenant subscription — Phase 1 SaaS plan model.
 *
 * Separate from workforce billing (invoices/payouts). Governs platform
 * feature access and usage limits per enterprise tenant.
 */

export type PlanCode = "trial" | "pilot" | "growth" | "enterprise";

export type SubscriptionFeature =
  | "sow.manual"
  | "sow.ai_intake"
  | "decomposition.ai"
  | "reviewer.hub"
  | "billing.workforce"
  | "billing.rate_cards"
  | "analytics.basic"
  | "analytics.full"
  | "analytics.export"
  | "compliance.module"
  | "audit.export"
  | "integrations.sso"
  | "integrations.hris"
  | "integrations.webhooks";

export type UsageMetricKey =
  | "activeSows"
  | "activeProjects"
  | "seats"
  | "aiInvocationsMonth";

export interface PlanLimits {
  activeSows: number | null;
  activeProjects: number | null;
  seats: number | null;
  aiInvocationsMonth: number | null;
  auditRetentionDays: number;
}

export interface PlanDefinition {
  code: PlanCode;
  label: string;
  description: string;
  features: readonly SubscriptionFeature[];
  limits: PlanLimits;
  /** Sales-led Phase 1 — list price hint for upgrade UI. */
  listPriceInr?: number;
}

export interface UsageSnapshot {
  activeSows: number;
  activeProjects: number;
  seats: number;
  aiInvocationsMonth: number;
}

export interface TenantSubscriptionSnapshot {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  tenantStatus: string;
  plan: PlanDefinition;
  /** When the current plan period started. */
  subscriptionStartedAt: string | null;
  /** Trial end — null when not on trial. */
  trialEndsAt: string | null;
  trialExpired: boolean;
  usage: UsageSnapshot;
  contractRef: string | null;
  /** Derived: features the tenant can use right now. */
  enabledFeatures: SubscriptionFeature[];
}

export type FeatureDenyReason =
  | "feature_not_in_plan"
  | "limit_reached"
  | "trial_expired"
  | "tenant_paused"
  | "tenant_closed";

export interface FeatureCheckResult {
  allowed: boolean;
  reason?: FeatureDenyReason;
  message?: string;
  upgradePlan?: PlanCode;
}

/** Auditable subscription tier change (admin / sales-led). */
export interface PlanChangeRecord {
  id: string;
  at: string;
  fromPlan: PlanCode | null;
  toPlan: PlanCode;
  changedByUserId: string;
  changedByName: string | null;
  changedByRole: string;
  source: "admin" | "system" | "sales_request";
  contractRef?: string | null;
  note?: string | null;
}
