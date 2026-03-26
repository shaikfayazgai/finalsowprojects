import type { AttentionItem, AppNotification } from "@/types/enterprise";

/* ══════════════════════════════════════════════════════════════
   ATTENTION ITEMS — sorted by priority rank (FSD 6.5)
   ══════════════════════════════════════════════════════════════ */

export const mockAttentionItems: AttentionItem[] = [
  {
    id: "att-ms-overdue",
    type: "MILESTONE_OVERDUE",
    title: "Payment overdue: Mobile Banking App — M2 — $28,000 — 5 days overdue",
    description: "Milestone payment past 7-day window. Project advancement may be blocked.",
    href: "/enterprise/billing/invoices/inv-003",
    timestamp: "2026-03-15T09:00:00Z",
    projectId: "proj-002",
  },
  {
    id: "att-escalation",
    type: "ESCALATION",
    title: "5 active escalations across 2 projects",
    description: "Mobile Banking App (3) and Healthcare Portal (2)",
    href: "/enterprise/projects/exceptions",
    timestamp: "2026-03-18T14:00:00Z",
  },
  {
    id: "att-rework",
    type: "REWORK",
    title: "Rework received: Payment Gateway Module",
    description: "Contributor resubmitted after rework request",
    href: "/enterprise/review/del-004",
    timestamp: "2026-03-17T11:00:00Z",
    projectId: "proj-001",
  },
  {
    id: "att-review",
    type: "REVIEW_PENDING",
    title: "2 submissions awaiting your review",
    description: "General Ledger API, Patient Records Module",
    href: "/enterprise/review",
    timestamp: "2026-03-18T08:00:00Z",
  },
  {
    id: "att-ms-due",
    type: "MILESTONE_DUE",
    title: "Payment due: ERP Platform — M2 — $42,500 — 3 days remaining",
    description: "Milestone invoice raised. Payment window closing.",
    href: "/enterprise/billing/invoices/inv-002",
    timestamp: "2026-03-17T10:00:00Z",
    projectId: "proj-001",
  },
  {
    id: "att-sow",
    type: "SOW_APPROVAL",
    title: "SOW approval required: AI-Powered CRM",
    description: "Legal review stage — TechVentures Inc.",
    href: "/enterprise/sow/sow-003/approve",
    timestamp: "2026-03-16T09:00:00Z",
  },
  {
    id: "att-plan",
    type: "PLAN_APPROVAL",
    title: "Plan ready for review: Healthcare Portal",
    description: "Task decomposition plan awaiting approval",
    href: "/enterprise/decomposition/plan-005",
    timestamp: "2026-03-16T15:00:00Z",
    projectId: "proj-004",
  },
  {
    id: "att-budget",
    type: "BUDGET_REVIEW",
    title: "Commercial revision requested: Supply Chain Analytics",
    description: "GlimmoraTeam requested budget revision",
    href: "/enterprise/sow/sow-004",
    timestamp: "2026-03-15T16:00:00Z",
  },
];

/* ══════════════════════════════════════════════════════════════
   NOTIFICATIONS — for notification bell (FSD 6.7)
   ══════════════════════════════════════════════════════════════ */

export const mockNotifications: AppNotification[] = [
  {
    id: "notif-001",
    title: "Evidence submitted for review",
    body: "Contributor D-2M submitted evidence for General Ledger API Endpoints.",
    severity: "high",
    read: false,
    timestamp: "2026-03-18T14:22:00Z",
    href: "/enterprise/review/del-001",
  },
  {
    id: "notif-002",
    title: "Rework resubmitted",
    body: "Payment Gateway Module has been resubmitted after rework.",
    severity: "high",
    read: false,
    timestamp: "2026-03-17T11:05:00Z",
    href: "/enterprise/review/del-004",
  },
  {
    id: "notif-003",
    title: "SOW approval required",
    body: "AI-Powered CRM SOW is at Legal Review stage and requires your action.",
    severity: "high",
    read: false,
    timestamp: "2026-03-16T09:30:00Z",
    href: "/enterprise/sow/sow-003/approve",
  },
  {
    id: "notif-004",
    title: "Blueprint published and ready",
    body: "E-Commerce Migration blueprint has been published for your review.",
    severity: "medium",
    read: false,
    timestamp: "2026-03-15T16:00:00Z",
    href: "/enterprise/decomposition/plan-003",
  },
  {
    id: "notif-005",
    title: "Assignment accepted by contributor",
    body: "Contributor A-7X accepted the Database Schema Design task.",
    severity: "medium",
    read: true,
    timestamp: "2026-03-14T10:20:00Z",
    href: "/enterprise/projects/proj-001",
  },
  {
    id: "notif-006",
    title: "New contributor registered to project",
    body: "A new contributor has been assigned to Mobile Banking App.",
    severity: "low",
    read: true,
    timestamp: "2026-03-13T08:45:00Z",
    href: "/enterprise/projects/proj-002",
  },
  {
    id: "notif-007",
    title: "SOW Commercial Review in progress",
    body: "Supply Chain Analytics SOW is under GlimmoraTeam commercial review.",
    severity: "low",
    read: true,
    timestamp: "2026-03-12T14:00:00Z",
    href: "/enterprise/sow/sow-004",
  },
];
