import type { ModuleConfig, NavSection } from "@/lib/config/navigation";
import {
  ADMIN_SECTION_VISIBILITY,
  type AdminRole,
} from "@/mocks/admin/personas";

/** Map nav href → ADMIN_SECTION_VISIBILITY key. */
const HREF_TO_SECTION: Array<{ prefix: string; key: string }> = [
  { prefix: "/admin/dashboard", key: "dashboard" },
  { prefix: "/admin/tenants", key: "tenants" },
  { prefix: "/admin/sow", key: "commercialGate" },
  { prefix: "/admin/mentors", key: "mentors" },
  { prefix: "/admin/skill-taxonomy", key: "skillTaxonomy" },
  { prefix: "/admin/rubric-templates", key: "rubricTemplates" },
  { prefix: "/admin/email-templates", key: "emailTemplates" },
  { prefix: "/admin/governance", key: "governance" },
  { prefix: "/admin/kyc", key: "kyc" },
  { prefix: "/admin/audit", key: "audit" },
  { prefix: "/admin/ai", key: "ai" },
  { prefix: "/admin/payment-rails", key: "paymentRails" },
  { prefix: "/admin/system-health", key: "systemHealth" },
  { prefix: "/admin/partnerships/universities", key: "universities" },
  { prefix: "/admin/partnerships/women-workforce", key: "womenWorkforce" },
  { prefix: "/admin/roles", key: "roles" },
];

function sectionKeyForHref(href: string): string | null {
  const match = HREF_TO_SECTION.find(({ prefix }) =>
    href === prefix || href.startsWith(`${prefix}/`),
  );
  return match?.key ?? null;
}

function canSeeSection(key: string, role: AdminRole): boolean {
  const allowed = (ADMIN_SECTION_VISIBILITY as Record<string, AdminRole[]>)[key];
  if (!allowed) return true;
  return allowed.includes(role);
}

/** Filter admin nav sections by plat.* persona RBAC (spec §3.2). */
export function filterAdminNav(config: ModuleConfig, role: AdminRole): ModuleConfig {
  const sections: NavSection[] = config.sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const key = sectionKeyForHref(item.href);
        if (!key) return true;
        return canSeeSection(key, role);
      }),
    }))
    .filter((section) => section.items.length > 0);

  return { ...config, sections };
}
