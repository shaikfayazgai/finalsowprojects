"use client";

/**
 * Contributor dashboard — Meridian design system (aligned with enterprise portal).
 * Topbar shows "Dashboard"; page carries greeting, KPIs, work queue, and inbox.
 */

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  CheckCircle2,
  ClipboardList,
  Flame,
  ListChecks,
  Send,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useMyTasks } from "@/lib/hooks/use-contributor-tasks";
import type { ContributorTaskSummary } from "@/lib/api/contributor-tasks";
import { useMyPayouts } from "@/lib/hooks/use-contributor-payouts";
import {
  ContributorStatusBadge,
  deriveContributorStatus,
  statusPriority,
  type ContributorStatusLabel,
} from "@/components/contributor/task-status-badge";
import { Skeleton } from "@/components/meridian";
import {
  ActionItemsCard,
  ActivityList,
  AIRecommendationsPanel,
  DashboardSection,
  KeyMetricCard,
  type ActivityRow,
  type AIRecommendation,
} from "@/components/meridian/dashboard";
import type { MetricTone } from "@/components/meridian/dashboard/KeyMetricCard";
import { ContentGrid, SplitPanel } from "@/components/meridian/layout";
import { PersonaDashboardModules, OrgChip } from "@/components/contributor/persona-modules";
import { useContributorTrack } from "@/lib/hooks/use-contributor-track";
import { cn } from "@/lib/utils/cn";

function greeting(name: string): string {
  const h = new Date().getHours();
  const part = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return `${part}, ${name}`;
}

function fmtAmount(amountMinor: number, currency: string): string {
  const symbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : `${currency} `;
  return `${symbol}${Math.round(amountMinor / 100).toLocaleString("en-IN")}`;
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

function inboxTone(label: ContributorStatusLabel): ActivityRow["tone"] {
  if (label === "feedback_requested" || label === "rejected") return "amber";
  if (label === "accepted") return "green";
  return "blue";
}

export default function ContributorDashboardPage() {
  const { data: session } = useSession();
  const trackQuery = useContributorTrack();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const userFirstName =
    session?.user?.name?.trim().split(/\s+/)[0] ??
    session?.user?.email?.split("@")[0] ??
    "there";

  const { data: tasksData, isLoading: tasksLoading } = useMyTasks({ limit: 100 });
  const { data: payoutsData } = useMyPayouts();

  const tasks = tasksData?.items ?? [];
  const payouts = payoutsData?.items ?? [];
  const loading = tasksLoading && !tasksData;

  const sortedTasks = React.useMemo(() => {
    return [...tasks].sort((a, b) => {
      const aLabel = deriveContributorStatus(a.status, a.latestSubmission?.status);
      const bLabel = deriveContributorStatus(b.status, b.latestSubmission?.status);
      const aPrio = statusPriority(aLabel);
      const bPrio = statusPriority(bLabel);
      if (aPrio !== bPrio) return aPrio - bPrio;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [tasks]);

  const heroTask = sortedTasks[0] ?? null;
  const supporting = sortedTasks.slice(1, 4);

  const lifecycle = React.useMemo(() => {
    const c: Record<ContributorStatusLabel, number> = {
      assigned: 0,
      in_progress: 0,
      draft: 0,
      submitted: 0,
      under_review: 0,
      feedback_requested: 0,
      resubmitted: 0,
      accepted: 0,
      rejected: 0,
    };
    for (const t of tasks) c[deriveContributorStatus(t.status, t.latestSubmission?.status)]++;
    return c;
  }, [tasks]);

  const inProgress = lifecycle.in_progress + lifecycle.draft + lifecycle.feedback_requested;
  const submitted = lifecycle.submitted + lifecycle.under_review + lifecycle.resubmitted;
  const activeCount = lifecycle.assigned + inProgress + submitted;
  const needsAttention = lifecycle.feedback_requested + lifecycle.assigned;

  const earnings = React.useMemo(() => {
    const now = new Date();
    const weekAgo = now.getTime() - 7 * 86_400_000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    let thisWeek = 0;
    let thisMonth = 0;
    for (const p of payouts) {
      if (!p.sentAt) continue;
      const t = new Date(p.sentAt).getTime();
      if (t >= weekAgo) thisWeek += p.amountMinor;
      if (t >= startOfMonth) thisMonth += p.amountMinor;
    }
    const decided = lifecycle.accepted + lifecycle.rejected;
    const acceptance = decided > 0 ? Math.round((lifecycle.accepted / decided) * 100) : null;
    const days = new Set<string>();
    for (const p of payouts) {
      if (!p.sentAt) continue;
      days.add(new Date(p.sentAt).toISOString().slice(0, 10));
    }
    let streak = 0;
    for (let i = 0; i < 60; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      if (days.has(d.toISOString().slice(0, 10))) streak++;
      else if (i > 0) break;
    }
    return {
      currency: payouts[0]?.currency ?? "INR",
      thisWeek,
      thisMonth,
      acceptance,
      streak,
    };
  }, [payouts, lifecycle.accepted, lifecycle.rejected]);

  const inboxRows: ActivityRow[] = React.useMemo(() => {
    return sortedTasks
      .filter((t) => {
        const l = deriveContributorStatus(t.status, t.latestSubmission?.status);
        return (
          l === "feedback_requested" ||
          l === "accepted" ||
          l === "rejected" ||
          l === "submitted"
        );
      })
      .slice(0, 6)
      .map((t) => {
        const label = deriveContributorStatus(t.status, t.latestSubmission?.status);
        return {
          id: t.id,
          icon: label === "accepted" ? CheckCircle2 : Send,
          tone: inboxTone(label),
          title: t.title,
          description: t.sow?.tenantName ?? undefined,
          meta: timeAgo(t.updatedAt),
        };
      });
  }, [sortedTasks]);

  const aiRecommendations: AIRecommendation[] = React.useMemo(() => {
    const items: AIRecommendation[] = [];
    if (needsAttention > 0 && heroTask) {
      items.push({
        id: "attention",
        title: `Clear ${needsAttention} task${needsAttention === 1 ? "" : "s"} needing action`,
        description: "Open the workroom to respond to feedback or start assigned work.",
        href: `/contributor/tasks/${heroTask.id}`,
      });
    }
    if (earnings.acceptance !== null && earnings.acceptance >= 90) {
      items.push({
        id: "acceptance",
        title: "Strong acceptance rate this period",
        description: `${earnings.acceptance}% accepted — keep the rhythm going.`,
        href: "/contributor/tasks/completed",
      });
    }
    if (lifecycle.accepted > 0) {
      items.push({
        id: "credentials",
        title: "Grow your credentials wallet",
        description: `${lifecycle.accepted} accepted deliverable${lifecycle.accepted === 1 ? "" : "s"} ready to showcase.`,
        href: "/contributor/credentials",
      });
    }
    if (activeCount === 0) {
      items.push({
        id: "profile",
        title: "Sharpen your profile for better matches",
        description: "Update skills and availability so the next tasks fit you.",
        href: "/contributor/profile/edit",
      });
    }
    return items.slice(0, 3);
  }, [needsAttention, heroTask, earnings.acceptance, lifecycle.accepted, activeCount]);

  const metrics: Array<{
    label: string;
    value: number;
    hint: string;
    href: string;
    tone: MetricTone;
    icon: typeof ListChecks;
    deltaLabel?: string;
  }> = [
    {
      label: "Assigned",
      value: lifecycle.assigned,
      hint: lifecycle.assigned ? "ready to start" : "queue clear",
      href: "/contributor/tasks",
      tone: lifecycle.assigned > 0 ? "violet" : "blue",
      icon: ClipboardList,
    },
    {
      label: "In progress",
      value: inProgress,
      hint: inProgress ? "active in workroom" : "nothing drafting",
      href: "/contributor/tasks",
      tone: "cyan",
      icon: ListChecks,
    },
    {
      label: "Submitted",
      value: submitted,
      hint: submitted ? "awaiting review" : "none pending review",
      href: "/contributor/tasks/submissions",
      tone: "amber",
      icon: Send,
    },
    {
      label: "Accepted",
      value: lifecycle.accepted,
      hint: lifecycle.accepted ? "lifetime accepted" : "build your record",
      href: "/contributor/tasks/completed",
      tone: "green",
      icon: Award,
      deltaLabel:
        earnings.acceptance !== null ? `${earnings.acceptance}% rate` : undefined,
    },
  ];

  const eyebrow =
    trackQuery.data?.supervision?.institution ??
    trackQuery.data?.orgChip?.tenant ??
    (mounted
      ? `Today · ${new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}`
      : "Today");

  const greetingLine = mounted ? greeting(userFirstName) : `Welcome, ${userFirstName}`;

  const primaryCta = heroTask
    ? {
        href: `/contributor/tasks/${heroTask.id}`,
        label: "Open workroom",
        icon: ListChecks,
      }
    : needsAttention > 0
      ? { href: "/contributor/tasks", label: "View assigned tasks", icon: ClipboardList }
      : null;

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Greeting */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-body text-[11px] font-bold uppercase tracking-[0.14em] text-text-link">
              {eyebrow}
            </p>
            <OrgChip />
          </div>
          <h1 className="mt-1.5 font-body text-[28px] font-semibold text-foreground tracking-[-0.025em] leading-tight" suppressHydrationWarning>
            {greetingLine}
          </h1>
          {loading ? (
            <p className="mt-2 font-body text-[14px] text-text-secondary">Loading your workload…</p>
          ) : needsAttention > 0 ? (
            <p className="mt-2 font-body text-[14px] text-text-secondary max-w-lg leading-relaxed">
              <span className="font-semibold text-foreground tabular-nums">{needsAttention}</span>{" "}
              {needsAttention === 1 ? "task needs" : "tasks need"} your attention —{" "}
              <span className="font-semibold text-foreground tabular-nums">{activeCount}</span>{" "}
              active overall.
            </p>
          ) : activeCount === 0 ? (
            <p className="mt-2 font-body text-[14px] text-text-secondary inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success-text shrink-0" strokeWidth={2.5} aria-hidden />
              Clear queue — sharpen your profile while you wait for the next match.
            </p>
          ) : (
            <p className="mt-2 font-body text-[14px] text-text-secondary max-w-lg leading-relaxed">
              <span className="font-semibold text-foreground tabular-nums">{activeCount}</span>{" "}
              {activeCount === 1 ? "task" : "tasks"} in your pipeline. Keep momentum in the workroom.
            </p>
          )}
        </div>
        {primaryCta ? (
          <Link
            href={primaryCta.href}
            className={cn(
              "inline-flex items-center gap-2 h-9 px-4 rounded-lg shrink-0",
              "bg-brand text-on-brand font-body text-[13px] font-semibold",
              "hover:bg-brand-hover transition-colors duration-fast",
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
          <Link
            href="/contributor/profile/edit"
            className={cn(
              "inline-flex items-center gap-2 h-9 px-4 rounded-lg shrink-0",
              "border border-stroke bg-surface text-foreground",
              "font-body text-[13px] font-semibold",
              "hover:bg-surface-hover transition-colors duration-fast",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
            )}
          >
            <Sparkles className="h-4 w-4 text-brand" strokeWidth={2} aria-hidden />
            Update profile
          </Link>
        )}
      </header>

      {/* KPI row */}
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
                hint={m.hint}
                deltaLabel={m.deltaLabel}
                spark={sparkFrom(m.value)}
              />
            </Link>
          ))}
        </ContentGrid>
      )}

      {/* Earnings strip */}
      <ContentGrid className="grid-cols-2 lg:grid-cols-4" gap="md">
        <Link href="/contributor/earnings" className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus">
          <KeyMetricCard
            icon={Wallet}
            tone="green"
            label="This week"
            value={fmtAmount(earnings.thisWeek, earnings.currency)}
            hint="paid out"
            spark={sparkFrom(Math.round(earnings.thisWeek / 100))}
          />
        </Link>
        <Link href="/contributor/earnings" className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus">
          <KeyMetricCard
            icon={TrendingUp}
            tone="cyan"
            label="This month"
            value={fmtAmount(earnings.thisMonth, earnings.currency)}
            hint="month to date"
            spark={sparkFrom(Math.round(earnings.thisMonth / 100))}
          />
        </Link>
        <KeyMetricCard
          icon={Award}
          tone="violet"
          label="Acceptance"
          value={earnings.acceptance !== null ? `${earnings.acceptance}%` : "—"}
          hint={earnings.acceptance !== null ? "decided tasks" : "no decisions yet"}
        />
        <KeyMetricCard
          icon={Flame}
          tone="amber"
          label="Streak"
          value={`${earnings.streak}d`}
          hint={earnings.streak > 0 ? "consecutive payout days" : "start earning"}
        />
      </ContentGrid>

      <SplitPanel
        asideWidth={360}
        aside={
          <div className="space-y-6">
            {!loading && needsAttention > 0 && (
              <ActionItemsCard
                pendingCount={needsAttention}
                approved={lifecycle.accepted}
                rejected={lifecycle.rejected}
                onHold={submitted}
                ctaHref={heroTask ? `/contributor/tasks/${heroTask.id}` : "/contributor/tasks"}
                ctaLabel="Open workroom"
                subtitle={
                  lifecycle.feedback_requested > 0
                    ? `${lifecycle.feedback_requested} awaiting your revision`
                    : "Assigned work ready to start"
                }
              />
            )}

            {!loading && aiRecommendations.length > 0 && (
              <AIRecommendationsPanel items={aiRecommendations} />
            )}

            <DashboardSection
              title="Inbox"
              description="Recent activity on your submissions"
              viewAllHref="/contributor/notifications"
              viewAllLabel="Notifications"
            >
              {inboxRows.length === 0 ? (
                <p className="font-body text-[13px] text-text-tertiary text-center py-6">
                  Quiet right now. New activity will appear here.
                </p>
              ) : (
                <ActivityList items={inboxRows} />
              )}
            </DashboardSection>
          </div>
        }
      >
        <div className="space-y-6">
          <DashboardSection
            eyebrow="Priority"
            title="Continue working"
            description={
              loading
                ? undefined
                : heroTask
                  ? "Pick up where you left off"
                  : "No active tasks in your queue"
            }
            viewAllHref="/contributor/tasks"
            viewAllLabel="All tasks"
          >
            {loading ? (
              <Skeleton className="h-44 rounded-xl" />
            ) : heroTask ? (
              <div className="space-y-3">
                <HeroTaskCard task={heroTask} />
                {supporting.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {supporting.map((t) => (
                      <SupportingTaskCard key={t.id} task={t} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <EmptyHero />
            )}
          </DashboardSection>

          <PersonaDashboardModules />
        </div>
      </SplitPanel>
    </div>
  );
}

/* ─────────────────────── cards ─────────────────────── */

function HeroTaskCard({ task }: { task: ContributorTaskSummary }) {
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border border-stroke-subtle p-5",
        "bg-gradient-to-br from-brand-subtle/80 via-surface to-surface",
        "shadow-[var(--shadow-xs)]",
      )}
    >
      <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand mb-2">
        Up next
      </p>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <h3 className="font-body text-[18px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
            {task.externalKey ? (
              <span className="font-mono text-text-secondary text-[14px]">{task.externalKey} · </span>
            ) : null}
            {task.title}
          </h3>
          {task.sow?.tenantName && (
            <p className="mt-1 font-body text-[12.5px] text-text-secondary">
              {task.sow.tenantName}
              {task.sow.title && <> · {task.sow.title}</>}
            </p>
          )}
        </div>
        <ContributorStatusBadge
          taskStatus={task.status}
          submissionStatus={task.latestSubmission?.status}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-[11.5px] text-text-secondary">
        {task.estimatedHours !== null && (
          <span className="font-mono tabular-nums">{task.estimatedHours}h estimated</span>
        )}
        {task.agreedRatePerHour && task.agreedCurrency && (
          <span className="font-mono tabular-nums">
            {task.agreedCurrency === "INR" ? "₹" : `${task.agreedCurrency} `}
            {task.agreedRatePerHour}/h
          </span>
        )}
        {task.requiredSkills.length > 0 && (
          <span>{task.requiredSkills.slice(0, 3).join(" · ")}</span>
        )}
      </div>
      <div className="mt-4">
        <Link
          href={`/contributor/tasks/${task.id}`}
          className={cn(
            "inline-flex items-center gap-1.5 h-9 px-4 rounded-lg",
            "bg-brand text-on-brand font-body text-[13px] font-semibold",
            "hover:bg-brand-hover transition-colors duration-fast",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
          )}
        >
          Open workroom
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </Link>
      </div>
    </article>
  );
}

function SupportingTaskCard({ task }: { task: ContributorTaskSummary }) {
  return (
    <Link
      href={`/contributor/tasks/${task.id}`}
      className={cn(
        "group rounded-xl border border-stroke-subtle bg-surface p-4",
        "hover:border-stroke hover:shadow-[var(--shadow-sm)]",
        "transition-all duration-fast",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <ContributorStatusBadge
          taskStatus={task.status}
          submissionStatus={task.latestSubmission?.status}
        />
        <ArrowUpRight
          className="h-3.5 w-3.5 text-text-tertiary group-hover:text-foreground transition-colors duration-fast"
          strokeWidth={2}
          aria-hidden
        />
      </div>
      <h3 className="font-body text-[13.5px] font-medium text-foreground line-clamp-2">{task.title}</h3>
      {task.sow?.tenantName && (
        <p className="mt-1 font-body text-[11.5px] text-text-tertiary truncate">{task.sow.tenantName}</p>
      )}
    </Link>
  );
}

function EmptyHero() {
  return (
    <div className="rounded-xl border border-dashed border-stroke-subtle bg-bg-subtle/40 px-6 py-10 text-center">
      <h3 className="font-body text-[15px] font-semibold text-foreground">No active tasks</h3>
      <p className="mt-1.5 font-body text-[13px] text-text-secondary max-w-md mx-auto leading-relaxed">
        When a project lead assigns you work, it appears here first. Until then, keep your profile
        sharp for better matches.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/contributor/profile/edit"
          className={cn(
            "inline-flex items-center gap-1.5 h-9 px-4 rounded-lg",
            "bg-brand text-on-brand font-body text-[13px] font-semibold",
            "hover:bg-brand-hover transition-colors duration-fast",
          )}
        >
          Update profile
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </Link>
        <Link
          href="/contributor/tasks"
          className={cn(
            "inline-flex items-center gap-1.5 h-9 px-4 rounded-lg",
            "border border-stroke bg-surface font-body text-[13px] font-semibold text-foreground",
            "hover:bg-surface-hover transition-colors duration-fast",
          )}
        >
          Browse tasks
        </Link>
      </div>
    </div>
  );
}
