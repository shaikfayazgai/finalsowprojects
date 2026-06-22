import type { PlanCode, PlanDefinition, SubscriptionFeature } from "./types";

const ALL_INTEGRATIONS: SubscriptionFeature[] = [
  "integrations.sso",
  "integrations.hris",
  "integrations.webhooks",
];

export const PLAN_CATALOG: Record<PlanCode, PlanDefinition> = {
  trial: {
    code: "trial",
    label: "Trial",
    description: "Evaluate Glimmora with core delivery workflows — time-boxed with caps.",
    listPriceInr: 0,
    features: [
      "sow.manual",
      "billing.workforce",
      "analytics.basic",
    ],
    limits: {
      activeSows: 1,
      activeProjects: 1,
      seats: 2,
      aiInvocationsMonth: 50,
      auditRetentionDays: 7,
    },
  },
  pilot: {
    code: "pilot",
    label: "Pilot",
    description: "First production MOU — manual SOW + decomposition with moderate limits.",
    listPriceInr: 49_999,
    features: [
      "sow.manual",
      "sow.ai_intake",
      "decomposition.ai",
      "billing.workforce",
      "billing.rate_cards",
      "analytics.basic",
    ],
    limits: {
      activeSows: 3,
      activeProjects: 3,
      seats: 5,
      aiInvocationsMonth: 500,
      auditRetentionDays: 30,
    },
  },
  growth: {
    code: "growth",
    label: "Growth",
    description: "Scaling delivery org — full SOW AI, reviewer hub, analytics, SSO.",
    listPriceInr: 1_99_999,
    features: [
      "sow.manual",
      "sow.ai_intake",
      "decomposition.ai",
      "reviewer.hub",
      "billing.workforce",
      "billing.rate_cards",
      "analytics.basic",
      "analytics.full",
      "analytics.export",
      "compliance.module",
      "audit.export",
      "integrations.sso",
    ],
    limits: {
      activeSows: 15,
      activeProjects: 10,
      seats: 25,
      aiInvocationsMonth: 5_000,
      auditRetentionDays: 90,
    },
  },
  enterprise: {
    code: "enterprise",
    label: "Enterprise",
    description: "Regulated and global programs — unlimited scale, all integrations, extended audit.",
    listPriceInr: undefined,
    features: [
      "sow.manual",
      "sow.ai_intake",
      "decomposition.ai",
      "reviewer.hub",
      "billing.workforce",
      "billing.rate_cards",
      "analytics.basic",
      "analytics.full",
      "analytics.export",
      "compliance.module",
      "audit.export",
      ...ALL_INTEGRATIONS,
    ],
    limits: {
      activeSows: null,
      activeProjects: null,
      seats: null,
      aiInvocationsMonth: null,
      auditRetentionDays: 365,
    },
  },
};

export const PLAN_ORDER: PlanCode[] = ["trial", "pilot", "growth", "enterprise"];

export function getPlan(code: PlanCode): PlanDefinition {
  return PLAN_CATALOG[code];
}

export function planIncludesFeature(plan: PlanDefinition, feature: SubscriptionFeature): boolean {
  return plan.features.includes(feature);
}

export function minimumPlanForFeature(feature: SubscriptionFeature): PlanCode {
  for (const code of PLAN_ORDER) {
    if (PLAN_CATALOG[code].features.includes(feature)) return code;
  }
  return "enterprise";
}

export function formatPlanPrice(plan: PlanDefinition): string {
  if (plan.code === "enterprise") return "Custom";
  if (plan.listPriceInr == null) return "Custom";
  if (plan.listPriceInr === 0) return "Free";
  return `₹${plan.listPriceInr.toLocaleString("en-IN")}/mo`;
}
