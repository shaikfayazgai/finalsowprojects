"use client";

/**
 * Enterprise dashboard — Meridian design system.
 * Topbar shows "Dashboard"; page carries greeting, KPIs, and queues.
 */

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  FileCheck2,
  FileText,
  FolderKanban,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { Skeleton } from "@/components/meridian";
import {
  ActionItemsCard,
  ActivityList,
  AIRecommendationsPanel,
  AttentionQueue,
  DashboardSection,
  KeyMetricCard,
  type ActivityRow,
  type AttentionItem,
} from "@/components/meridian/dashboard";
import type { MetricTone } from "@/components/meridian/dashboard/KeyMetricCard";
import { ContentGrid, SplitPanel } from "@/components/meridian/layout";
import { useSowList } from "@/lib/hooks/use-sow-v2";
import { usePlanList } from "@/lib/hooks/use-decomposition-v2";
import { useReviewQueue } from "@/lib/hooks/use-enterprise-review";
import { useAuditEvents } from "@/lib/hooks/use-audit-view";
import { useMe } from "@/lib/hooks/use-me";
import { useTenantSubscription } from "@/lib/hooks/use-tenant-subscription";
import { PlanUsageStrip } from "@/components/enterprise/subscription/PlanUsageStrip";
import type { SowSummary, SowStage } from "@/lib/sow/types";
import { cn } from "@/lib/utils/cn";

const STAGE_LABEL: Record<SowStage, string> = {
  business: "Business",
  commercial: "Commercial",
  legal: "Legal",
  security: "Security",
  final: "Final",
};

const AUDIT_ACTION_LABEL: Record<string, string> = {
  "audit.export": "Audit log exported",
  "sow.create": "SOW created",
  "sow.submit": "SOW submitted for approval",
  "sow.approve": "SOW approved",
  "sow.reject": "SOW rejected",
  "milestone.accepted": "Milestone accepted",
  "milestone.paid": "Milestone paid",
};

function tenantFromEmail(email: string | null | undefined): string | undefined {
  if (!email || !email.includes("@")) return undefined;
  const domain = email.split("@")[1]?.split(".")[0];
  if (!domain) return undefined;
  return domain.charAt(0).toUpperCase() + domain.slice(1);
}

function greeting(name: string): string {
  const h = new Date().getHours();
  const part = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return `${part}, ${name}`;
}

function hoursAgo(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

function humanizeAuditAction(action: string): string {
  if (AUDIT_ACTION_LABEL[action]) return AUDIT_ACTION_LABEL[action];
  return action
    .split(".")
    .map((part) => part.replace(/_/g, " "))
    .join(" · ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function sortAttentionSows(sows: SowSummary[]): SowSummary[] {
  return [...sows].sort((a, b) => {
    const aStale = hoursAgo(a.updatedAt) > 48;
    const bStale = hoursAgo(b.updatedAt) > 48;
    if (aStale && bStale) {
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }
    if (aStale !== bStale) return aStale ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function sparkFrom(value: number): number[] {
  if (value <= 0) return [0, 0, 0, 0, 0];
  return [
    Math.max(1, Math.round(value * 0.65)),
    Math.max(1, Math.round(value * 0.78)),
    Math.max(1, Math.round(value * 0.86)),
    Math.max(1, Math.round(value * 0.94)),
    value,
  ];
}

export default function EnterpriseDashboardPage() {
  const { data: me } = useMe();
  const { data: session } = useSession();
  const { data: sowData, isLoading: sowLoading } = useSowList({ limit: 100 });
  const { data: planData, isLoading: planLoading } = usePlanList({ limit: 100 });
  const { data: reviewData } = useReviewQueue({ limit: 100 });
  const { data: auditData } = useAuditEvents({ limit: 8 });
  const { data: subscription } = useTenantSubscription();

  const sessionName = session?.user?.name?.trim();
  const sessionEmail = session?.user?.email ?? undefined;
  const tenantName =
    me?.tenant?.name ?? tenantFromEmail(me?.user?.email ?? sessionEmail) ?? "Glimmora HQ";
  const userFirstName =
    me?.user?.name?.trim().split(/\s+/)[0] ??
    sessionName?.split(/\s+/)[0] ??
    me?.user?.email?.split("@")[0] ??
    sessionEmail?.split("@")[0] ??
    "there";

  const sows = sowData?.items ?? [];
  const plans = planData?.items ?? [];
  const pendingReviews = reviewData?.items ?? [];

  const sowCounts = React.useMemo(() => {
    const c = { draft: 0, approval: 0, approved: 0, rejected: 0, withdrawn: 0, archived: 0 };
    for (const s of sows) c[s.status]++;
    return c;
  }, [sows]);

  const planCounts = React.useMemo(() => {
    const c = { draft: 0, approved: 0, active: 0, archived: 0 };
    for (const p of plans) c[p.status]++;
    return c;
  }, [plans]);

  const pendingApprovalAttention = sortAttentionSows(
    sows.filter((s) => s.status === "approval"),
  );

  const needsAction = pendingApprovalAttention.length + pendingReviews.length;
  const staleCount = pendingApprovalAttention.filter((s) => hoursAgo(s.updatedAt) > 48).length;
  const loading = sowLoading && !sowData;

  const metrics = [
    {
      label: "In approval",
      value: sowCounts.approval,
      hint: staleCount > 0 ? "SOWs in approval queue" : "awaiting sign-off",
      href: "/enterprise/sow?status=approval",
      tone: (staleCount > 0 ? "amber" : "violet") as MetricTone,
      icon: FileCheck2,
      deltaLabel: staleCount > 0 ? `${staleCount} overdue` : undefined,
    },
    {
      label: "Acceptance",
      value: pendingReviews.length,
      hint: pendingReviews.length ? "submissions to review" : "queue clear",
      href: "/enterprise/review",
      tone: (pendingReviews.length > 5 ? "amber" : "green") as MetricTone,
      icon: ShieldCheck,
    },
    {
      label: "In delivery",
      value: planCounts.active,
      hint: "active projects",
      href: "/enterprise/projects",
      tone: "green" as MetricTone,
      icon: Briefcase,
    },
    {
      label: "Decomposition",
      value: planCounts.draft,
      hint: "plans awaiting PMO",
      href: "/enterprise/decomposition?status=draft",
      tone: "blue" as MetricTone,
      icon: Workflow,
    },
  ];

  const pipelineSteps = [
    { key: "draft", label: "Draft", value: sowCounts.draft, href: "/enterprise/sow?status=draft" },
    {
      key: "approval",
      label: "Approval",
      value: sowCounts.approval,
      active: sowCounts.approval > 0,
      href: "/enterprise/sow?status=approval",
    },
    { key: "approved", label: "Approved", value: sowCounts.approved, href: "/enterprise/sow?status=approved" },
    { key: "active", label: "Delivery", value: planCounts.active, href: "/enterprise/projects" },
    { key: "archived", label: "Archived", value: planCounts.archived, href: "/enterprise/projects" },
  ];

  const pipelineTotal =
    sowCounts.draft +
    sowCounts.approval +
    sowCounts.approved +
    planCounts.active +
    planCounts.archived;

  const attentionItems: AttentionItem[] = React.useMemo(() => {
    const sowItems: AttentionItem[] = pendingApprovalAttention.slice(0, 8).map((s) => {
      const hrs = hoursAgo(s.updatedAt);
      const overdue = hrs > 48;
      return {
        id: s.id,
        kind: overdue ? "sla" : "sign_off",
        category: "sow_approval" as const,
        title: s.title,
        entity: `${s.stage ? STAGE_LABEL[s.stage] : "Approval"} · ${timeAgo(s.updatedAt)}`,
        slaHours: overdue ? Math.round(48 - hrs) : undefined,
        href: `/enterprise/sow/${s.id}`,
      };
    });
    const reviewItems: AttentionItem[] = pendingReviews.slice(0, 8).map((r) => ({
      id: r.submissionId,
      kind: "sign_off" as const,
      category: "acceptance" as const,
      title: r.taskTitle,
      entity: `${r.contributorName} · v${r.version}`,
      href: `/enterprise/review/${r.submissionId}`,
    }));
    return [...sowItems, ...reviewItems];
  }, [pendingApprovalAttention, pendingReviews]);

  const suggestedActions = React.useMemo(() => {
    const out: Array<{ id: string; title: string; description: string; href: string }> = [];
    if (staleCount > 0) {
      out.push({
        id: "overdue-approvals",
        title: "Prioritise overdue approvals",
        description: `${staleCount} SOW${staleCount === 1 ? "" : "s"} waiting 48+ hours in the approval queue.`,
        href: "/enterprise/sow?status=approval",
      });
    }
    if (planCounts.active === 0 && sowCounts.approved > 0) {
      out.push({
        id: "decompose-sows",
        title: "Unlock delivery capacity",
        description: `${sowCounts.approved} approved SOW${sowCounts.approved === 1 ? "" : "s"} ready for decomposition.`,
        href: "/enterprise/decomposition",
      });
    }
    if (pendingReviews.length >= 3) {
      out.push({
        id: "acceptance-backlog",
        title: "Clear acceptance backlog",
        description: `${pendingReviews.length} contributor submissions waiting for review.`,
        href: "/enterprise/review",
      });
    }
    return out.slice(0, 3);
  }, [staleCount, planCounts.active, sowCounts.approved, pendingReviews.length]);

  const activityRows: ActivityRow[] = React.useMemo(() => {
    const seen = new Set<string>();
    const out: ActivityRow[] = [];
    for (const ev of auditData?.events ?? []) {
      if (ev.action === "audit.export") {
        if (seen.has("audit.export")) continue;
        seen.add("audit.export");
      }
      const tone =
        ev.severity === "critical"
          ? "red"
          : ev.severity === "warning"
            ? "amber"
            : "blue";
      const Icon =
        ev.severity === "critical"
          ? AlertOctagon
          : ev.severity === "warning"
            ? AlertTriangle
            : Activity;
      out.push({
        id: ev.id,
        icon: Icon,
        tone,
        title: humanizeAuditAction(ev.action),
        description:
          ev.action === "audit.export"
            ? "Compliance export"
            : (ev.resource.label ?? ev.resource.type),
        meta: timeAgo(ev.timestamp),
      });
      if (out.length >= 6) break;
    }
    return out;
  }, [auditData?.events]);

  const sowById = React.useMemo(() => new Map(sows.map((s) => [s.id, s])), [sows]);
  const activeProjects = plans
    .filter((p) => p.status === "active")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);
  const readyProjects = plans
    .filter((p) => p.status === "approved")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  const primaryCta = pendingApprovalAttention.length > 0
    ? { href: "/enterprise/sow?status=approval", label: "Open approval queue", icon: FileCheck2 }
    : pendingReviews.length > 0
      ? { href: "/enterprise/review", label: "Review submissions", icon: ShieldCheck }
      : sowCounts.approved > 0 && planCounts.active === 0
        ? { href: "/enterprise/decomposition", label: "Decompose SOWs", icon: Workflow }
        : null;

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Greeting */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="font-body text-[11px] font-bold uppercase tracking-[0.14em] text-text-link">
            {tenantName}
          </p>
          <h1 className="mt-1.5 font-body text-[28px] font-semibold text-foreground tracking-[-0.025em] leading-tight">
            {greeting(userFirstName)}
          </h1>
          {loading ? (
            <p className="mt-2 font-body text-[14px] text-text-secondary">Loading workspace…</p>
          ) : needsAction > 0 ? (
            <p className="mt-2 font-body text-[14px] text-text-secondary max-w-lg leading-relaxed">
              <span className="font-semibold text-foreground tabular-nums">{needsAction}</span>{" "}
              {needsAction === 1 ? "item needs" : "items need"} your attention across SOW approval
              and acceptance today.
            </p>
          ) : (
            <p className="mt-2 font-body text-[14px] text-text-secondary inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success-text shrink-0" strokeWidth={2.5} aria-hidden />
              All queues clear — delivery is unblocked.
            </p>
          )}
        </div>
        {primaryCta ? (
          <Link
            href={primaryCta.href}
            className={cn(
              "inline-flex items-center gap-2 h-9 px-4 rounded-lg shrink-0",
              "bg-brand text-on-brand font-body text-[13px] font-semibold",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
            )}
          >
            {React.createElement(primaryCta.icon, {
              className: "h-4 w-4",
              strokeWidth: 2,
              "aria-hidden": true,
            })}
            {primaryCta.label}
          </Link>
        ) : (
          <div className="flex flex-wrap gap-2 shrink-0">
            <SecondaryLink href="/enterprise/sow" icon={FileText}>
              SOW workspace
            </SecondaryLink>
            <SecondaryLink href="/enterprise/projects" icon={FolderKanban}>
              Projects
            </SecondaryLink>
          </div>
        )}
      </header>

      {subscription ? <PlanUsageStrip subscription={subscription} /> : null}

      {/* KPI cards */}
      {loading ? (
        <ContentGrid className="grid-cols-2 lg:grid-cols-4" gap="md">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[148px] rounded-2xl" />
          ))}
        </ContentGrid>
      ) : (
        <ContentGrid className="grid-cols-2 lg:grid-cols-4" gap="md">
          {metrics.map((m) => (
            <Link
              key={m.label}
              href={m.href}
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-2xl"
            >
              <KeyMetricCard
                icon={m.icon}
                tone={m.tone}
                label={m.label}
                value={m.value}
                deltaLabel={m.deltaLabel}
                hint={m.hint}
                spark={sparkFrom(m.value)}
              />
            </Link>
          ))}
        </ContentGrid>
      )}

      {/* Main + aside */}
      <SplitPanel
        asideWidth={360}
        aside={
          <div className="space-y-6">
            {!loading && needsAction > 0 && (
              <ActionItemsCard
                pendingCount={needsAction}
                approved={sowCounts.approved}
                rejected={sowCounts.rejected}
                onHold={planCounts.draft}
                ctaHref={
                  pendingApprovalAttention.length > 0
                    ? "/enterprise/sow?status=approval"
                    : "/enterprise/review"
                }
                ctaLabel={
                  pendingApprovalAttention.length > 0
                    ? "Open approval queue"
                    : "Review submissions"
                }
                subtitle={
                  staleCount > 0
                    ? `${staleCount} approval${staleCount === 1 ? "" : "s"} overdue · act today`
                    : "Awaiting your review & sign-off"
                }
              />
            )}

            {!loading && suggestedActions.length > 0 && (
              <AIRecommendationsPanel items={suggestedActions} />
            )}

            <DashboardSection
              title="Recent activity"
              viewAllHref="/enterprise/audit"
              viewAllLabel="Audit log"
            >
              {activityRows.length === 0 ? (
                <p className="font-body text-[13px] text-text-tertiary text-center py-6">
                  No recent activity.
                </p>
              ) : (
                <ActivityList items={activityRows} />
              )}
            </DashboardSection>
          </div>
        }
      >
        <div className="space-y-6">
          {loading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : (
            <AttentionQueue items={attentionItems} />
          )}

          <DashboardSection
            eyebrow="Lifecycle"
            title="Portfolio snapshot"
            description={
              loading
                ? undefined
                : `${pipelineTotal} record${pipelineTotal === 1 ? "" : "s"} across origination → delivery`
            }
            viewAllHref="/enterprise/sow"
            viewAllLabel="All SOWs"
          >
            {loading ? (
              <Skeleton className="h-24 rounded-xl" />
            ) : pipelineTotal === 0 ? (
              <p className="font-body text-[13px] text-text-tertiary text-center py-4">
                No records yet.{" "}
                <Link href="/enterprise/sow/intake" className="text-text-link font-medium">
                  Create a SOW
                </Link>
              </p>
            ) : (
              <PortfolioStages steps={pipelineSteps} total={pipelineTotal} />
            )}
          </DashboardSection>

          <DashboardSection
            eyebrow="Delivery"
            title="Projects"
            description="Active deliveries and plans ready to kick off"
            viewAllHref="/enterprise/projects"
          >
            {planLoading && !planData ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : activeProjects.length === 0 && readyProjects.length === 0 ? (
              <p className="font-body text-[13px] text-text-tertiary text-center py-4">
                No projects yet. Approve and decompose a SOW to begin delivery.
              </p>
            ) : (
              <div className="space-y-4">
                {activeProjects.length > 0 && (
                  <ProjectBlock label="In delivery" projects={activeProjects} sowById={sowById} />
                )}
                {readyProjects.length > 0 && (
                  <ProjectBlock
                    label="Ready to kick off"
                    projects={readyProjects}
                    sowById={sowById}
                    muted
                  />
                )}
              </div>
            )}
          </DashboardSection>
        </div>
      </SplitPanel>
    </div>
  );
}

/* ─── Local presentation ─── */

function SecondaryLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg",
        "border border-stroke-subtle bg-surface font-body text-[13px] font-semibold text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
      )}
    >
      <Icon className="h-4 w-4 text-text-secondary" strokeWidth={2} aria-hidden />
      {children}
    </Link>
  );
}

function PortfolioStages({
  steps,
  total,
}: {
  steps: Array<{ key: string; label: string; value: number; active?: boolean; href: string }>;
  total: number;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {steps.map((step) => {
        const pct = total > 0 ? Math.round((step.value / total) * 100) : 0;
        return (
          <Link
            key={step.key}
            href={step.href}
            className={cn(
              "rounded-xl border p-4 text-center",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
              step.active
                ? "border-brand bg-brand-subtle/30"
                : "border-stroke-subtle bg-surface",
            )}
          >
            <p
              className={cn(
                "font-body text-[26px] font-bold tabular-nums leading-none tracking-[-0.02em]",
                step.active ? "text-brand" : "text-foreground",
              )}
            >
              {step.value}
            </p>
            <p className="mt-2 font-body text-[11px] font-semibold text-foreground">{step.label}</p>
            <p className="mt-0.5 font-mono text-[10px] text-text-tertiary tabular-nums">{pct}%</p>
          </Link>
        );
      })}
    </div>
  );
}

function ProjectBlock({
  label,
  projects,
  sowById,
  muted,
}: {
  label: string;
  projects: { id: string; sowId: string; updatedAt: string }[];
  sowById: Map<string, SowSummary>;
  muted?: boolean;
}) {
  return (
    <div>
      <p className="font-body text-[10px] font-bold uppercase tracking-[0.12em] text-text-tertiary mb-2">
        {label}
      </p>
      <ul className="space-y-2">
        {projects.map((p) => {
          const sow = sowById.get(p.sowId);
          return (
            <li key={p.id}>
              <Link
                href={`/enterprise/projects/${p.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-stroke-subtle px-4 py-3",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
                  muted ? "bg-surface" : "bg-surface",
                )}
              >
                <span
                  className={cn(
                    "grid place-items-center h-8 w-8 rounded-lg shrink-0",
                    muted ? "bg-brand-subtle text-brand" : "bg-success-subtle text-success-text",
                  )}
                >
                  <Briefcase className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-body text-[13px] font-semibold text-foreground truncate">
                    {sow?.title ?? `Plan ${p.id.slice(0, 8)}`}
                  </p>
                  <p className="font-body text-[11px] text-text-tertiary mt-0.5">
                    {muted ? "Approved plan" : "On track"} · {timeAgo(p.updatedAt)}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
