import type { ModuleConfig } from "@/lib/config/navigation";
import type { SubscriptionFeature, TenantSubscriptionSnapshot } from "./types";
import { canUseFeature } from "./enforce";

export interface NavFeatureRequirement {
  href: string;
  feature: SubscriptionFeature;
  lockedLabel?: string;
}

/** Sidebar items gated by subscription — matched by href prefix. */
export const ENTERPRISE_NAV_GATES: NavFeatureRequirement[] = [
  { href: "/enterprise/decomposition", feature: "decomposition.ai" },
  { href: "/enterprise/reviewer", feature: "reviewer.hub", lockedLabel: "Growth" },
  { href: "/enterprise/review", feature: "reviewer.hub", lockedLabel: "Growth" },
  { href: "/enterprise/billing/rate-cards", feature: "billing.rate_cards" },
  { href: "/enterprise/compliance", feature: "compliance.module", lockedLabel: "Growth" },
  { href: "/enterprise/analytics", feature: "analytics.basic" },
  { href: "/enterprise/settings/integrations", feature: "integrations.sso", lockedLabel: "Growth" },
];

function gateForHref(href: string): NavFeatureRequirement | undefined {
  return ENTERPRISE_NAV_GATES.find(
    (g) => href === g.href || href.startsWith(g.href + "/"),
  );
}

export function filterEnterpriseNav(
  config: ModuleConfig,
  subscription: TenantSubscriptionSnapshot | null | undefined,
): ModuleConfig {
  if (!subscription) return config;

  return {
    ...config,
    sections: config.sections.map((section) => ({
      ...section,
      items: section.items.map((item) => {
        const gate = gateForHref(item.href);
        if (!gate) return item;
        const allowed = canUseFeature(subscription, gate.feature);
        if (allowed) return item;
        return {
          ...item,
          badge: gate.lockedLabel ? `${gate.lockedLabel}+` : "Upgrade",
        };
      }),
    })),
  };
}
