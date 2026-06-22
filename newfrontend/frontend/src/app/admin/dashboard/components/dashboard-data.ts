import {
  ADMIN_ATTENTION_VISIBILITY,
  type MockAdminAttentionItem,
} from "@/mocks/admin/dashboard";
import { ADMIN_SECTION_VISIBILITY, type AdminRole } from "@/mocks/admin/personas";
import type { AdminAttentionKind, MockAdminDashboard } from "@/mocks/admin/dashboard";
import { isAdminSectionPhaseHidden } from "@/lib/admin/phase-gate";
import { sectionKeyForHref } from "@/lib/admin/filter-admin-nav";
import type { PulseMetric } from "@/components/meridian/dashboard/ExecutivePulseBand";
import {
  Boxes,
  FileText,
  HeartHandshake,
  Server,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

export interface LinkedPulseMetric extends PulseMetric {
  href: string;
}

/** Dashboard attention kind → admin section, so we can apply the phase gate. */
const ATTENTION_KIND_SECTION: Record<AdminAttentionKind, string> = {
  sow: "commercialGate",
  governance: "governance",
  kyc: "kyc",
  rail: "paymentRails",
  system: "systemHealth",
};

export function filterAttentionForRole(items: MockAdminAttentionItem[], role: AdminRole) {
  return items.filter(
    (item) =>
      ADMIN_ATTENTION_VISIBILITY[item.kind]?.includes(role) &&
      !isAdminSectionPhaseHidden(ATTENTION_KIND_SECTION[item.kind]),
  );
}

/** Recent-activity kind → admin section, for the phase gate. */
const RECENT_KIND_SECTION: Record<string, string> = {
  tenant: "tenants",
  mentor: "mentors",
  sow: "commercialGate",
  kyc: "kyc",
  rubric: "rubricTemplates",
  audit: "audit",
  ai: "ai",
  skill: "skillTaxonomy",
  rail: "paymentRails",
};

/** Drop recent-activity rows for sections hidden in the current phase. */
export function filterRecentForPhase<T extends { kind: string }>(items: T[]): T[] {
  return items.filter((ev) => !isAdminSectionPhaseHidden(RECENT_KIND_SECTION[ev.kind] ?? ""));
}

/** Drop platform-signal cards that link to phase-hidden sections. */
export function filterSignalsForPhase<T extends { href: string }>(items: T[]): T[] {
  return items.filter((sig) => {
    const key = sectionKeyForHref(sig.href);
    return !key || !isAdminSectionPhaseHidden(key);
  });
}

export function canSeeSection(section: keyof typeof ADMIN_SECTION_VISIBILITY, role: AdminRole) {
  if (isAdminSectionPhaseHidden(section as string)) return false;
  return ADMIN_SECTION_VISIBILITY[section]?.includes(role) ?? false;
}

export function pulseBandForRole(role: AdminRole, d: MockAdminDashboard): LinkedPulseMetric[] {
  const degraded = d.kpis.servicesUp < d.kpis.servicesTotal;
  const pool: Array<LinkedPulseMetric & { key: string; section: keyof typeof ADMIN_SECTION_VISIBILITY }> = [
    {
      id: "services",
      key: "services",
      label: "Services",
      value: `${d.kpis.servicesUp}/${d.kpis.servicesTotal}`,
      hint: degraded ? "1 degraded" : "healthy",
      tone: degraded ? "warning" : "success",
      icon: Server,
      spark: sparkFrom(d.kpis.servicesUp),
      href: "/admin/system-health",
      section: "systemHealth",
    },
    {
      id: "tenants",
      key: "tenants",
      label: "Tenants",
      value: d.kpis.tenants,
      hint: "active",
      icon: Boxes,
      spark: sparkFrom(d.kpis.tenants),
      href: "/admin/tenants",
      section: "tenants",
    },
    {
      id: "gov",
      key: "gov",
      label: "Cases",
      value: d.pipeline.governanceOpen,
      hint: "open",
      tone: d.pipeline.governanceOpen > 2 ? "warning" : undefined,
      icon: ShieldCheck,
      spark: sparkFrom(d.pipeline.governanceOpen),
      href: "/admin/governance",
      section: "governance",
    },
    {
      id: "kyc",
      key: "kyc",
      label: "KYC",
      value: d.pipeline.kycPending,
      hint: "pending",
      tone: d.pipeline.kycPending > 0 ? "warning" : "success",
      icon: Users,
      spark: sparkFrom(d.pipeline.kycPending),
      href: "/admin/kyc",
      section: "kyc",
    },
    {
      id: "mentors",
      key: "mentors",
      label: "Mentors",
      value: d.kpis.mentors,
      icon: Users,
      spark: sparkFrom(d.kpis.mentors),
      href: "/admin/mentors",
      section: "mentors",
    },
    {
      id: "sows",
      key: "sows",
      label: "SOWs",
      value: d.kpis.activeSows,
      icon: FileText,
      spark: sparkFrom(Math.min(d.kpis.activeSows, 50)),
      href: "/admin/sow",
      section: "commercialGate",
    },
    {
      id: "payouts",
      key: "payouts",
      label: "Held payouts",
      value: d.actionBreakdown.onHold,
      tone: "error",
      icon: Wallet,
      href: "/admin/payment-rails",
      section: "paymentRails",
    },
    {
      id: "partners",
      key: "partners",
      // No live partnerships feed yet — show 0 rather than a fabricated count.
      label: "Women Workforce partners",
      value: 0,
      icon: HeartHandshake,
      href: "/admin/partnerships/women-workforce",
      section: "womenWorkforce",
    },
  ];

  const pick = (keys: string[]) =>
    pool.filter((m) => keys.includes(m.key) && canSeeSection(m.section, role));

  switch (role) {
    case "plat.payments":
      return pick(["services", "payouts", "sows", "tenants"]);
    case "plat.mpm":
      return pick(["mentors", "tenants", "sows", "services"]);
    case "plat.partnerships":
      return pick(["partners", "kyc", "gov", "tenants"]);
    case "plat.ai":
      return pick(["services", "sows", "gov", "tenants"]);
    case "plat.compliance":
      return pick(["gov", "kyc", "services", "tenants"]);
    case "plat.tns":
      return pick(["gov", "kyc", "tenants", "services"]);
    case "plat.tsm":
      return pick(["tenants", "sows", "mentors", "services"]);
    default:
      // Phase-1 platform admin: tenants / SOWs / KYC / mentors (services + gov
      // are phase-hidden and would be filtered out anyway).
      return pick(["tenants", "sows", "kyc", "mentors"]);
  }
}

export function roleBrief(_role: AdminRole): { title: string; body: string; href: string } | null {
  // Role briefs are suppressed until backed by a live per-role feed — no
  // fabricated counts on the dashboard.
  return null;
}

export function sparkFrom(value: number): number[] {
  if (value <= 0) return [0, 0, 0, 0, 0];
  return [
    Math.max(1, Math.round(value * 0.65)),
    Math.max(1, Math.round(value * 0.78)),
    Math.max(1, Math.round(value * 0.86)),
    Math.max(1, Math.round(value * 0.94)),
    value,
  ];
}

export function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

export const ATTENTION_KIND_LABEL: Record<MockAdminAttentionItem["kind"], string> = {
  sow: "Commercial gate",
  governance: "Governance",
  kyc: "KYC",
  rail: "Payment rail",
  system: "System",
};
