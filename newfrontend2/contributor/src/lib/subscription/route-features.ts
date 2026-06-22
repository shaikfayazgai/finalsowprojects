import type { SubscriptionFeature } from "./types";

/** Map enterprise routes to required subscription features (if any). */
export const ROUTE_FEATURE_REQUIREMENTS: Array<{
  prefix: string;
  feature: SubscriptionFeature;
  label: string;
}> = [
  { prefix: "/enterprise/sow/intake", feature: "sow.ai_intake", label: "AI SOW intake" },
  { prefix: "/enterprise/sow/generate", feature: "sow.ai_intake", label: "AI SOW generation" },
  { prefix: "/enterprise/decomposition", feature: "decomposition.ai", label: "AI decomposition" },
  { prefix: "/enterprise/reviewer", feature: "reviewer.hub", label: "QA Review hub" },
  { prefix: "/enterprise/review", feature: "reviewer.hub", label: "Acceptance review" },
  { prefix: "/enterprise/billing/rate-cards", feature: "billing.rate_cards", label: "Rate cards" },
  { prefix: "/enterprise/compliance", feature: "compliance.module", label: "Compliance" },
  { prefix: "/enterprise/settings/integrations", feature: "integrations.sso", label: "Integrations" },
  { prefix: "/enterprise/analytics/economic", feature: "analytics.full", label: "Economic analytics" },
  { prefix: "/enterprise/analytics/workforce", feature: "analytics.full", label: "Workforce analytics" },
  { prefix: "/enterprise/audit/export", feature: "audit.export", label: "Audit export" },
];

export function featureForPath(pathname: string): (typeof ROUTE_FEATURE_REQUIREMENTS)[number] | null {
  for (const entry of ROUTE_FEATURE_REQUIREMENTS) {
    if (pathname === entry.prefix || pathname.startsWith(entry.prefix + "/")) {
      return entry;
    }
  }
  return null;
}
