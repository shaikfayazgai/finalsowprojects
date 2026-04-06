import {
  LayoutDashboard,
  FileText,
  FolderKanban,
  Users,
  Shield,
  ScrollText,
  Settings,
  ListChecks,
  Wallet,
  Award,
  GraduationCap,
  HeartHandshake,
  MessageSquare,
  ClipboardCheck,
  History,
  AlertTriangle,
  TrendingUp,
  Activity,
  Server,
  Boxes,
  PieChart,
  UserCog,
  KeyRound,
  ShieldCheck,
  Plug,
  UsersRound,
  FormInput,
  BookMarked,
  FileStack,
  Scale,
  BarChart3,
  Bell,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export interface ModuleConfig {
  id: string;
  name: string;
  shortName: string;
  basePath: string;
  accentColor: string;
  sections: NavSection[];
  cta?: {
    label: string;
    href: string;
  };
}

export const enterpriseNav: ModuleConfig = {
  id: "enterprise",
  name: "Enterprise Admin Console",
  shortName: "Enterprise",
  basePath: "/enterprise",
  accentColor: "brown",
  sections: [
    /* ─── Dashboard (no section label) ─── */
    {
      items: [
        { label: "Dashboard", href: "/enterprise/dashboard", icon: LayoutDashboard },
      ],
    },
    /* ─── SOW ─── */
    {
      title: "SOW",
      items: [
        { label: "SOW Repository", href: "/enterprise/sow", icon: FileText },
        { label: "Approval Pipeline", href: "/enterprise/sow/approval", icon: ClipboardCheck },
        { label: "Archive", href: "/enterprise/sow/archive", icon: History },
      ],
    },
    /* ─── Planning ─── */
    {
      title: "Planning",
      items: [
        { label: "Decomposition", href: "/enterprise/decomposition", icon: Boxes },
        { label: "Teams", href: "/enterprise/team", icon: UsersRound },
      ],
    },
    /* ─── Project Monitoring ─── */
    {
      title: "Project Monitoring",
      items: [
        { label: "Project Portfolio", href: "/enterprise/projects", icon: FolderKanban },
        { label: "Exceptions", href: "/enterprise/projects/exceptions", icon: AlertTriangle },
      ],
    },
    /* ─── Review & Acceptance ─── */
    {
      title: "Review & Acceptance",
      items: [
        { label: "Evidence Review", href: "/enterprise/review", icon: ClipboardCheck },
        { label: "Acceptance Logs", href: "/enterprise/review/history", icon: History },
      ],
    },
    /* ─── Billing ─── */
    {
      title: "Billing",
      items: [
        { label: "Billing", href: "/enterprise/billing", icon: Wallet },
      ],
    },
    /* ─── Organization ─── */
    {
      title: "Organization",
      items: [
        { label: "Settings", href: "/enterprise/settings", icon: Settings },
        { label: "Roles & Access", href: "/enterprise/admin/roles", icon: KeyRound },
        { label: "Policies", href: "/enterprise/admin/config/apg", icon: ShieldCheck },
        { label: "Integrations", href: "/enterprise/admin/config/integrations", icon: Plug },
        { label: "Contributors", href: "/enterprise/admin/users", icon: UserCog },
        { label: "SOW Intake Forms", href: "/enterprise/admin/config/sow-forms", icon: FormInput },
        { label: "Clause Library", href: "/enterprise/admin/config/clause-library", icon: BookMarked },
        { label: "SOW Templates", href: "/enterprise/admin/config/templates", icon: FileStack },
        { label: "Review Rubrics", href: "/enterprise/admin/config/review-rubrics", icon: Scale },
      ],
    },
    {
      title: "Analytics & Intelligence",
      items: [
        { label: "Workforce", href: "/enterprise/analytics", icon: BarChart3 },
        { label: "Economic", href: "/enterprise/analytics/economic", icon: TrendingUp },
        { label: "Governance & Risk", href: "/enterprise/analytics/governance", icon: Shield },
        { label: "Self-service", href: "/enterprise/analytics/reports", icon: PieChart },
      ],
    },
    /* ─── Audit ─── */
    {
      title: "Audit",
      items: [
        { label: "Audit Log", href: "/enterprise/audit", icon: ScrollText },
        { label: "Notifications", href: "/enterprise/notifications", icon: Bell },
      ],
    },
  ],
};

export const contributorNav: ModuleConfig = {
  id: "contributor",
  name: "Contributor Portal",
  shortName: "Contributor",
  basePath: "/contributor",
  accentColor: "teal",
  sections: [
    {
      items: [
        { label: "Dashboard", href: "/contributor/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "Work",
      items: [
        { label: "Tasks", href: "/contributor/tasks", icon: ListChecks },
        { label: "Submissions", href: "/contributor/tasks/submissions", icon: ClipboardCheck },
      ],
    },
    {
      title: "Growth",
      items: [
        { label: "Earnings", href: "/contributor/earnings", icon: Wallet },
        { label: "Credentials", href: "/contributor/credentials", icon: Award },
        { label: "Learning", href: "/contributor/learning", icon: GraduationCap },
      ],
    },
    {
      title: "Connect",
      items: [
        { label: "Support", href: "/contributor/support", icon: HeartHandshake },
        { label: "Messages", href: "/contributor/messages", icon: MessageSquare },
      ],
    },
    {
      items: [
        { label: "Profile", href: "/contributor/profile", icon: Users },
        { label: "Settings", href: "/contributor/settings", icon: Settings },
      ],
    },
  ],
};

export const mentorNav: ModuleConfig = {
  id: "mentor",
  name: "Mentor & Reviewer Workspace",
  shortName: "Mentor",
  basePath: "/mentor",
  accentColor: "forest",
  sections: [
    {
      items: [
        { label: "Dashboard", href: "/mentor/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "Reviews",
      items: [
        { label: "Review Queue", href: "/mentor/queue", icon: ListChecks },
        { label: "Active Review", href: "/mentor/review", icon: ClipboardCheck },
        { label: "History", href: "/mentor/history", icon: History },
      ],
    },
    {
      title: "Actions",
      items: [
        { label: "Escalations", href: "/mentor/escalation", icon: AlertTriangle },
        { label: "Mentorship", href: "/mentor/mentorship", icon: GraduationCap },
      ],
    },
    {
      items: [
        { label: "Settings", href: "/mentor/settings", icon: Settings },
      ],
    },
  ],
};

export const analyticsNav: ModuleConfig = {
  id: "analytics",
  name: "Analytics & Intelligence",
  shortName: "Analytics",
  basePath: "/analytics",
  accentColor: "gold",
  sections: [
    {
      items: [
        { label: "Overview", href: "/analytics/overview", icon: LayoutDashboard },
      ],
    },
    {
      title: "Dashboards",
      items: [
        { label: "Workforce", href: "/analytics/workforce", icon: Users },
        { label: "Economic", href: "/analytics/economic", icon: TrendingUp },
        { label: "Operational", href: "/analytics/operational", icon: Activity },
        { label: "Governance", href: "/analytics/governance", icon: Shield },
      ],
    },
    {
      title: "Tools",
      items: [
        { label: "Report Builder", href: "/analytics/explorer", icon: PieChart },
        { label: "System Health", href: "/analytics/system", icon: Server },
      ],
    },
    {
      items: [
        { label: "Settings", href: "/analytics/settings", icon: Settings },
      ],
    },
  ],
};

export const allModules = [enterpriseNav, contributorNav, mentorNav, analyticsNav] as const;
