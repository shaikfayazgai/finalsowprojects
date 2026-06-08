import {
  ADMIN_ATTENTION_VISIBILITY,
  type MockAdminAttentionItem,
} from "@/mocks/admin/dashboard";
import { ADMIN_SECTION_VISIBILITY, type AdminRole } from "@/mocks/admin/personas";
import type { MockAdminDashboard } from "@/mocks/admin/dashboard";
import type { PulseMetric } from "@/components/meridian/dashboard/ExecutivePulseBand";
import {
  Boxes,
  FileText,
  GraduationCap,
  Server,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

export interface LinkedPulseMetric extends PulseMetric {
  href: string;
}

export function filterAttentionForRole(items: MockAdminAttentionItem[], role: AdminRole) {
  return items.filter((item) => ADMIN_ATTENTION_VISIBILITY[item.kind]?.includes(role));
}

export function canSeeSection(section: keyof typeof ADMIN_SECTION_VISIBILITY, role: AdminRole) {
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
      label: "Partners",
      value: 0,
      icon: GraduationCap,
      href: "/admin/partnerships/universities",
      section: "universities",
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
      return pick(["services", "tenants", "gov", "kyc"]);
  }
}

export function roleBrief(role: AdminRole): { title: string; body: string; href: string } | null {
  const map: Partial<Record<AdminRole, { title: string; body: string; href: string }>> = {};
  return map[role] ?? null;
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
  governance: "Governance",
  kyc: "KYC",
  rail: "Payment rail",
  system: "System",
};
