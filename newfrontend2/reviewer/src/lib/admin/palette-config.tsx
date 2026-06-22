/**
 * Command palette bundles per portal module.
 */

import type { ModuleConfig } from "@/lib/config/navigation";
import {
  Award,
  Boxes,
  ClipboardCheck,
  Compass,
  FileText,
  Flag,
  GraduationCap,
  LifeBuoy,
  ListChecks,
  PlayCircle,
  Receipt,
  Server,
  Sparkles,
  UserCircle2,
  Users,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";

export type CommandGroup = "actions" | "pages" | "ai" | "recent";

export interface PaletteCommandItem {
  id: string;
  label: string;
  hint?: string;
  href: string;
  group: CommandGroup;
  icon: ReactNode;
  shortcut?: string;
}

export interface PaletteBundle {
  quickActions: PaletteCommandItem[];
  aiActions: PaletteCommandItem[];
  suggestedHrefs: string[];
  subtitle: string;
}

const ENTERPRISE_QUICK: PaletteCommandItem[] = [
  {
    id: "qa-new-sow",
    label: "Create new SOW",
    hint: "Start intake workspace",
    href: "/enterprise/sow/intake",
    group: "actions",
    icon: <FileText className="h-4 w-4" strokeWidth={1.75} />,
  },
  {
    id: "qa-acceptance",
    label: "Open acceptance queue",
    hint: "Pending enterprise sign-off",
    href: "/enterprise/review",
    group: "actions",
    icon: <ClipboardCheck className="h-4 w-4" strokeWidth={1.75} />,
  },
  {
    id: "qa-delivery",
    label: "Delivery tracking",
    hint: "Operational progression",
    href: "/enterprise/delivery-tracking",
    group: "actions",
    icon: <PlayCircle className="h-4 w-4" strokeWidth={1.75} />,
  },
  {
    id: "qa-billing",
    label: "Billing & invoices",
    hint: "Financial closure",
    href: "/enterprise/billing",
    group: "actions",
    icon: <Receipt className="h-4 w-4" strokeWidth={1.75} />,
  },
];

const ADMIN_QUICK: PaletteCommandItem[] = [
  {
    id: "qa-new-tenant",
    label: "Provision new tenant",
    hint: "6-step tenant wizard",
    href: "/admin/tenants/new",
    group: "actions",
    icon: <Boxes className="h-4 w-4" strokeWidth={1.75} />,
  },
  {
    id: "qa-commercial-gate",
    label: "Commercial gate",
    hint: "SOWs awaiting Glimmora sign-off",
    href: "/admin/sow",
    group: "actions",
    icon: <FileText className="h-4 w-4" strokeWidth={1.75} />,
  },
  {
    id: "qa-governance",
    label: "Governance cases",
    hint: "Trust & safety queue",
    href: "/admin/governance",
    group: "actions",
    icon: <Flag className="h-4 w-4" strokeWidth={1.75} />,
  },
  {
    id: "qa-kyc",
    label: "KYC reviews",
    hint: "Contributor onboarding flags",
    href: "/admin/kyc",
    group: "actions",
    icon: <Users className="h-4 w-4" strokeWidth={1.75} />,
  },
];

const ENTERPRISE_AI: PaletteCommandItem[] = [
  {
    id: "ai-attention",
    label: "Where should I look next?",
    hint: "AI attention prioritization",
    href: "/enterprise/delivery-tracking",
    group: "ai",
    icon: <Compass className="h-4 w-4" strokeWidth={1.75} />,
  },
  {
    id: "ai-escalations",
    label: "Show active escalations",
    hint: "Open bottlenecks panel",
    href: "/enterprise/delivery-tracking/bottlenecks",
    group: "ai",
    icon: <Sparkles className="h-4 w-4" strokeWidth={1.75} />,
  },
  {
    id: "ai-decomposition",
    label: "Open decomposition workspace",
    hint: "Workstreams and plans",
    href: "/enterprise/decomposition",
    group: "ai",
    icon: <Boxes className="h-4 w-4" strokeWidth={1.75} />,
  },
];

const CONTRIBUTOR_QUICK: PaletteCommandItem[] = [
  {
    id: "qa-tasks",
    label: "View assigned tasks",
    hint: "Your active queue",
    href: "/contributor/tasks",
    group: "actions",
    icon: <ListChecks className="h-4 w-4" strokeWidth={1.75} />,
  },
  {
    id: "qa-earnings",
    label: "Earnings & payouts",
    hint: "Balance and withdrawal",
    href: "/contributor/earnings",
    group: "actions",
    icon: <Wallet className="h-4 w-4" strokeWidth={1.75} />,
  },
  {
    id: "qa-profile",
    label: "Update profile",
    hint: "Skills and availability",
    href: "/contributor/profile/edit",
    group: "actions",
    icon: <UserCircle2 className="h-4 w-4" strokeWidth={1.75} />,
  },
  {
    id: "qa-support",
    label: "Get help",
    hint: "Support and safety",
    href: "/contributor/support",
    group: "actions",
    icon: <LifeBuoy className="h-4 w-4" strokeWidth={1.75} />,
  },
];

const CONTRIBUTOR_AI: PaletteCommandItem[] = [
  {
    id: "ai-profile",
    label: "Improve my match quality",
    hint: "Profile and skills tips",
    href: "/contributor/profile",
    group: "ai",
    icon: <Sparkles className="h-4 w-4" strokeWidth={1.75} />,
  },
  {
    id: "ai-credentials",
    label: "Browse credentials",
    hint: "Portfolio and verifiable skills",
    href: "/contributor/credentials",
    group: "ai",
    icon: <Award className="h-4 w-4" strokeWidth={1.75} />,
  },
];

const ADMIN_AI: PaletteCommandItem[] = [
  {
    id: "ai-health",
    label: "System health",
    hint: "Service status overview",
    href: "/admin/system-health",
    group: "ai",
    icon: <Server className="h-4 w-4" strokeWidth={1.75} />,
  },
  {
    id: "ai-mentors",
    label: "Mentor program",
    hint: "Roster and competency",
    href: "/admin/mentors",
    group: "ai",
    icon: <GraduationCap className="h-4 w-4" strokeWidth={1.75} />,
  },
  {
    id: "ai-agents",
    label: "AI agent config",
    hint: "Enable / disable agents",
    href: "/admin/ai",
    group: "ai",
    icon: <Sparkles className="h-4 w-4" strokeWidth={1.75} />,
  },
];

export function getPaletteBundle(config: ModuleConfig): PaletteBundle {
  if (config.id === "contributor") {
    return {
      quickActions: CONTRIBUTOR_QUICK,
      aiActions: CONTRIBUTOR_AI,
      suggestedHrefs: [
        "/contributor/dashboard",
        "/contributor/tasks",
        "/contributor/tasks/submissions",
        "/contributor/earnings",
        "/contributor/credentials",
        "/contributor/profile",
        "/contributor/notifications",
        "/contributor/support",
      ],
      subtitle: "Contributor workspace · jump anywhere or start an action",
    };
  }

  if (config.id === "admin") {
    return {
      quickActions: ADMIN_QUICK,
      aiActions: ADMIN_AI,
      suggestedHrefs: [
        "/admin/dashboard",
        "/admin/tenants",
        "/admin/sow",
        "/admin/governance",
        "/admin/kyc",
        "/admin/mentors",
        "/admin/audit",
        "/admin/system-health",
      ],
      subtitle: "Glimmora Operations · jump anywhere or start an action",
    };
  }

  return {
    quickActions: ENTERPRISE_QUICK,
    aiActions: ENTERPRISE_AI,
    suggestedHrefs: [
      "/enterprise/dashboard",
      "/enterprise/sow",
      "/enterprise/projects",
      "/enterprise/review",
      "/enterprise/billing",
      "/enterprise/audit",
      "/enterprise/analytics",
      "/enterprise/notifications",
    ],
    subtitle: "Enterprise workspace · jump anywhere or start an action",
  };
}
