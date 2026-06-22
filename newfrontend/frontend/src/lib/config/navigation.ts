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
  HeartHandshake,
  MessageSquare,
  ClipboardCheck,
  History,
  AlertTriangle,
  TrendingUp,
  LifeBuoy,
  Activity,
  Server,
  Boxes,
  PieChart,
  UsersRound,
  BarChart3,
  Inbox,
  ClipboardList,
  Mail,
  ArrowUpRight,
  RotateCcw,
  FileSearch,
  ShieldAlert,
  Sparkles,
  Flag,
  CircuitBoard,
  FileWarning,
  Siren,
  Send,
  CheckCircle2,
  Lightbulb,
  Award,
  MessagesSquare,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  /**
   * Optional keyboard shortcut hint (e.g., "G D" for "go to Dashboard").
   * Rendered as a kbd chip on the right of expanded nav items, and
   * surfaced in the collapsed-mode tooltip. The actual key binding is
   * wired separately (Phase 3 work) — this field is the display hint.
   */
  shortcut?: string;
  /**
   * When true, the item appears in the sidebar at muted opacity and
   * doesn't navigate on click. Used to surface the spec IA for surfaces
   * that aren't built yet, so the operator can see what's coming
   * without hitting a broken link.
   */
  disabled?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
  /**
   * Optional visual emphasis. `primary` lifts the section title weight and
   * adds a subtle accent so the operator's core surface reads as the anchor
   * of the IA. Renders as a no-op when omitted.
   */
  emphasis?: "primary";
  /**
   * Sidebar zone for layered IA rendering. `primary` = main operational
   * surfaces (Dashboard, SOW, Delivery, Acceptance, Finance). `governance`
   * = secondary oversight (Reviewer, Audit, Compliance, Analytics).
   * `footer` = pinned to the bottom of the sidebar (Profile, Notifications)
   * with a hairline separator. `utility` = legacy icon-only footer row,
   * superseded by `footer`. Defaults to `primary` when omitted.
   */
  zone?: "primary" | "governance" | "footer" | "utility";
}

export interface ModuleConfig {
  id: string;
  name: string;
  shortName: string;
  basePath: string;
  /** Brand link target. Defaults to `${basePath}/dashboard`. */
  homePath?: string;
  accentColor: string;
  sections: NavSection[];
  cta?: {
    label: string;
    href: string;
  };
}

/**
 * Enterprise sidebar — built directly from doc 02 §3.1.
 *
 * Sections rendered in this order: OVERVIEW → ORIGINATION → DELIVERY →
 * FINANCE → GOVERNANCE → INSIGHTS. Profile, notifications, and settings
 * live in the topbar account menu — not the sidebar. RBAC visibility (§3.2)
 * is enforced client-side via `filterEnterpriseNavByRbac` in the enterprise
 * layout (tenant role grants from `/api/me` + member directory fallback).
 *
 * Items marked `disabled: true` are spec'd routes whose pages aren't
 * built yet (e.g. /settings/tenant). They surface the planned IA so
 * the operator can see what's coming; clicks are inert.
 */
export const enterpriseNav: ModuleConfig = {
  id: "enterprise",
  name: "Enterprise Workspace",
  shortName: "Enterprise",
  basePath: "/enterprise",
  accentColor: "brown",
  sections: [
    /* ═══════════════ OVERVIEW ═══════════════ */
    {
      title: "Overview",
      zone: "primary",
      items: [
        { label: "Dashboard", href: "/enterprise/dashboard", icon: LayoutDashboard, shortcut: "G D" },
      ],
    },

    /* ═══════════════ ORIGINATION ═══════════════ */
    {
      title: "Origination",
      zone: "primary",
      emphasis: "primary",
      items: [
        { label: "SOW Workspace", href: "/enterprise/sow", icon: FileText, shortcut: "G S" },
        { label: "Decomposition", href: "/enterprise/decomposition", icon: Boxes, shortcut: "G C" },
      ],
    },

    /* ═══════════════ DELIVERY ═══════════════
     * Review work is done by the mentor (Glimmora) + reviewer (their own QA
     * portal at /enterprise/reviewer). The admin just monitors delivery via
     * Projects + the task pages, so "Acceptance" (a dropped gate) and "QA Review"
     * (the reviewer's portal) are intentionally NOT surfaced in the admin nav.
     */
    {
      title: "Delivery",
      zone: "primary",
      items: [
        { label: "Projects", href: "/enterprise/projects", icon: FolderKanban, shortcut: "G P" },
        { label: "Workforce", href: "/enterprise/workforce", icon: UsersRound },
      ],
    },

    /* ═══════════════ FINANCE ═══════════════
     * Billing + Payouts only. Rate Cards is intentionally NOT surfaced to the
     * enterprise — contributor pay rates are private to Glimmora; the enterprise
     * only ever sees its own budget (client price).
     */
    {
      title: "Finance",
      zone: "primary",
      items: [
        { label: "Billing", href: "/enterprise/billing", icon: Wallet, shortcut: "G B" },
        { label: "Payouts", href: "/enterprise/billing/payouts", icon: Send },
      ],
    },

    /* ═══════════════ GOVERNANCE ═══════════════ */
    {
      title: "Governance",
      zone: "governance",
      items: [
        { label: "Audit", href: "/enterprise/audit", icon: ScrollText },
        { label: "Compliance", href: "/enterprise/compliance", icon: ShieldAlert },
        { label: "Help & Support", href: "/enterprise/support-center", icon: LifeBuoy },
      ],
    },

    /* ═══════════════ INSIGHTS ═══════════════ */
    {
      title: "Insights",
      zone: "governance",
      items: [
        { label: "Analytics", href: "/enterprise/analytics", icon: BarChart3 },
      ],
    },
  ],
};

export const contributorNav: ModuleConfig = {
  id: "contributor",
  name: "Contributor Workspace",
  shortName: "Contributor",
  basePath: "/contributor",
  accentColor: "teal",
  sections: [
    /* ─── Today — orient + the highest-velocity workspace ─── */
    {
      title: "Today",
      items: [
        { label: "Dashboard", href: "/contributor/dashboard", icon: LayoutDashboard },
      ],
    },

    /* ─── My work — pipeline by state ─── */
    {
      title: "My work",
      items: [
        { label: "Opportunities", href: "/contributor/opportunities", icon: Sparkles },
        { label: "Assigned", href: "/contributor/tasks", icon: ListChecks },
        { label: "Submissions", href: "/contributor/tasks/submissions", icon: Send },
        { label: "Revisions", href: "/contributor/tasks/revisions", icon: RotateCcw },
        { label: "Completed", href: "/contributor/tasks/completed", icon: CheckCircle2 },
      ],
    },

    /* ─── My record — reward + reputation ─── */
    {
      title: "My record",
      items: [
        { label: "Earnings", href: "/contributor/earnings", icon: Wallet },
        { label: "Credentials", href: "/contributor/credentials", icon: Award },
      ],
    },

    /* ─── Support — safety net ─── */
    {
      title: "Support",
      items: [
        { label: "Help & Support", href: "/contributor/support-center", icon: LifeBuoy },
      ],
    },

    /* Account tail — spec §3.1 (no section header) */
    {
      zone: "footer",
      items: [
        { label: "Profile", href: "/contributor/profile", icon: UserRound },
        { label: "Settings", href: "/contributor/settings", icon: Settings },
      ],
    },
  ],
};

export const mentorNav: ModuleConfig = {
  id: "mentor",
  name: "Mentor Workspace",
  shortName: "Mentor",
  basePath: "/mentor",
  accentColor: "forest",
  sections: [
    /* Sidebar per spec doc 03 §3.1 — 7 items max, with Escalations
     * role-conditional (mentor.senior / mentor.lead). All Phase 2 surfaces
     * (analytics/*, ai/*, contributors/*, governance/*, sla-monitor,
     * reviews deep analytics) are removed.
     */
    {
      title: "Today",
      items: [
        { label: "Dashboard", href: "/mentor/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "Review",
      emphasis: "primary",
      items: [
        { label: "Assigned SOWs", href: "/mentor/sows", icon: FileText },
        { label: "Queue", href: "/mentor/queue", icon: ClipboardList },
        { label: "Escalations", href: "/mentor/escalation", icon: ArrowUpRight },
        { label: "History", href: "/mentor/history", icon: History },
      ],
    },
    {
      title: "Mentorship",
      items: [
        { label: "Sessions", href: "/mentor/mentorship", icon: HeartHandshake },
      ],
    },
    {
      title: "Support",
      items: [
        { label: "Help & Support", href: "/mentor/support-center", icon: LifeBuoy },
      ],
    },
  ],
};

export const reviewerNav: ModuleConfig = {
  id: "reviewer",
  name: "Reviewer Workspace",
  shortName: "Reviewer",
  basePath: "/enterprise/reviewer",
  homePath: "/enterprise/reviewer",
  accentColor: "teal",
  sections: [
    /* Per spec doc 02 §5.F — 4 surfaces in the enterprise reviewer
     * sub-portal: dashboard, queue, history, metrics. Phase 2 sub-routes
     * (qa-inbox, task-monitor, mentoring-log, notifications) sealed.
     */
    {
      items: [
        { label: "Dashboard", href: "/enterprise/reviewer", icon: LayoutDashboard },
      ],
    },
    {
      title: "Review",
      emphasis: "primary",
      items: [
        { label: "Assigned SOWs", href: "/enterprise/reviewer/sows", icon: FileText },
        { label: "Queue",   href: "/enterprise/reviewer/queue",   icon: ClipboardList },
        { label: "History", href: "/enterprise/reviewer/history", icon: History },
        { label: "Metrics", href: "/enterprise/reviewer/metrics", icon: TrendingUp },
      ],
    },
    {
      title: "Support",
      items: [
        { label: "Help & Support", href: "/enterprise/reviewer/support-center", icon: LifeBuoy },
      ],
    },
    {
      zone: "footer",
      items: [
        { label: "Settings", href: "/enterprise/reviewer/settings", icon: Settings },
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

export const adminNav: ModuleConfig = {
  id: "admin",
  name: "Glimmora · Operations",
  shortName: "Admin",
  basePath: "/admin",
  accentColor: "blue",
  sections: [
    {
      items: [{ label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard }],
    },
    {
      title: "Customers",
      items: [
        { label: "Tenants", href: "/admin/tenants", icon: Boxes },
        { label: "Commercial gate", href: "/admin/sow", icon: FileText },
        { label: "Work pricing", href: "/admin/decomposition", icon: ListChecks },
      ],
    },
    {
      title: "Talent",
      items: [
        { label: "Mentors", href: "/admin/mentors", icon: Users },
        { label: "Skill taxonomy", href: "/admin/skill-taxonomy", icon: Sparkles },
      ],
    },
    {
      title: "Standards",
      items: [
        { label: "Rubric templates", href: "/admin/rubric-templates", icon: ClipboardCheck },
        { label: "Email templates", href: "/admin/email-templates", icon: Mail },
      ],
    },
    {
      title: "Compliance",
      items: [
        { label: "Cases", href: "/admin/governance", icon: Flag, badge: "3" },
        { label: "Resolution Center", href: "/admin/cases", icon: LifeBuoy },
        { label: "Complaints", href: "/admin/complaints", icon: MessageSquare },
        { label: "KYC reviews", href: "/admin/kyc", icon: ShieldAlert, badge: "1" },
        { label: "Audit log", href: "/admin/audit", icon: ScrollText },
      ],
    },
    {
      title: "Infrastructure",
      zone: "governance",
      items: [
        { label: "AI agents", href: "/admin/ai", icon: CircuitBoard },
        { label: "Payment rails", href: "/admin/payment-rails", icon: Wallet },
        { label: "System health", href: "/admin/system-health", icon: Server },
      ],
    },
    {
      title: "Programs",
      zone: "governance",
      items: [{ label: "Women workforce", href: "/admin/partnerships/women-workforce", icon: HeartHandshake }],
    },
  ],
};

export const allModules = [enterpriseNav, contributorNav, mentorNav, reviewerNav, analyticsNav, adminNav] as const;
