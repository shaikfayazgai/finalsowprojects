"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { stagger } from "@/lib/utils/motion-variants";
import { mockProjects, mockDeliverables, mockPlans } from "@/mocks/data/enterprise-projects";
import { mockInvoices } from "@/mocks/data/enterprise-billing";
import { mockActivityFeed } from "@/mocks/data/enterprise-analytics";
import { mockAttentionItems } from "@/mocks/data/enterprise-dashboard";
import type { ProjectHealth, DashboardMetrics, PortfolioCounts, FinancialFigures } from "@/types/enterprise";

import { DashboardSkeleton } from "./components/dashboard-skeleton";
import { HeaderStrip } from "./components/header-strip";
import { MetricTiles } from "./components/metric-tiles";
import { AttentionPanel } from "./components/attention-panel";
import { ProjectPipeline } from "./components/project-pipeline";
import { FinancialSnapshot } from "./components/financial-snapshot";
import { ActivityFeedPanel } from "./components/activity-feed-panel";

/* ══════════════════════════════════════════ Derived data ══════════════════════════════════════════ */

const activeProjects = mockProjects.filter((p) => p.health !== "completed");
const totalEscalations = mockProjects.reduce((sum, p) => sum + p.escalations, 0);
const exceptionsProjectCount = mockProjects.filter((p) => p.escalations > 0).length;
const pendingDeliverables = mockDeliverables.filter((d) => d.status === "pending");
const draftPlans = mockPlans.filter((p) => p.status === "draft" || p.status === "pending_review");
const pendingApprovals = pendingDeliverables.length + draftPlans.length;
const totalBudget = activeProjects.reduce((sum, p) => sum + p.budget, 0);
const totalSpent = activeProjects.reduce((sum, p) => sum + p.spent, 0);
const budgetPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

const onTimeDelivery = 87; // mock SLA %

const portfolio: PortfolioCounts = {
  onTrack: activeProjects.filter((p) => p.health === "on_track").length,
  atRisk: activeProjects.filter((p) => p.health === "at_risk").length,
  behind: activeProjects.filter((p) => p.health === "behind").length,
};

const metrics: DashboardMetrics = {
  activeProjects: activeProjects.length,
  openExceptions: totalEscalations,
  exceptionsProjectCount,
  pendingApprovals,
  budgetSpent: totalSpent,
  budgetTotal: totalBudget,
  budgetPercent,
  currency: "$",
};

const paidInvoices = mockInvoices.filter((i) => i.status === "paid");
const overdueInvoices = mockInvoices.filter((i) => i.status === "overdue");
const pendingInvoices = mockInvoices.filter((i) => i.status === "pending");
const nextDueInvoice = pendingInvoices.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

const financials: FinancialFigures = {
  contracted: totalBudget,
  paid: paidInvoices.reduce((sum, i) => sum + i.amount, 0),
  nextDue: nextDueInvoice
    ? { amount: nextDueInvoice.amount, dueDate: nextDueInvoice.dueDate, label: `${mockProjects.find((p) => p.id === nextDueInvoice.projectId)?.title ?? "Project"} M${nextDueInvoice.milestoneId?.slice(-1) ?? ""}` }
    : null,
  overdue: overdueInvoices.reduce((sum, i) => sum + i.amount, 0),
  overdueProjectCount: new Set(overdueInvoices.map((i) => i.projectId)).size,
  activeProjectCount: activeProjects.length,
  currency: "$",
};

/* ══════════════════════════════════════════ DASHBOARD ══════════════════════════════════════════ */

export default function EnterpriseDashboardPage() {
  const [healthFilter, setHealthFilter] = React.useState<ProjectHealth | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Initial skeleton — 200ms then reveal
  React.useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(t);
  }, []);

if (isLoading) return <DashboardSkeleton />;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* Zone 1 — Header Strip */}
      <HeaderStrip
        attentionCount={mockAttentionItems.length}
        portfolio={portfolio}
        avgSla={onTimeDelivery}
        healthFilter={healthFilter}
        onFilterChange={setHealthFilter}
      />

      {/* Zone 2 — Metric Tiles */}
      <MetricTiles metrics={metrics} />

      {/* Zone 3 — Attention + Pipeline */}
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: "3fr 2fr" }}>
        <AttentionPanel items={mockAttentionItems} />
        <ProjectPipeline projects={mockProjects} healthFilter={healthFilter} />
      </div>

      {/* Zone 4 — Financial + Activity */}
      <div className="grid grid-cols-2 gap-4">
        <FinancialSnapshot figures={financials} />
        <ActivityFeedPanel events={mockActivityFeed} />
      </div>
    </motion.div>
  );
}
