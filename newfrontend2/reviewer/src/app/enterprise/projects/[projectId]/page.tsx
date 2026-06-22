"use client";

/**
 * Project detail — single-column record view aligned with SOW / decomposition UX.
 *
 *   Back link → header (title, meta, primary action)
 *   Context banners (health · exceptions · unassigned)
 *   Milestone progress (compact stepper)
 *   Project details (metadata + source plan/SOW)
 *   Tabbed panel: Activity · Delivery · Team · Exceptions · Budget · Audit
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  Briefcase,
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  Users,
  ChevronRight,
  ChevronUp,
  XCircle,
  Send,
  Wallet,
} from "lucide-react";
import {
  getProjectMock,
  acceptProjectMilestoneMock,
  payProjectMilestoneMock,
  projectOverlay,
  type ProjectDetail,
  type ProjectHealth,
  type ProjectMilestoneStatus,
  type ProjectTaskRow,
} from "@/lib/projects/projects-mock";
import { useOverlayVersion } from "@/lib/enterprise/mocks/overlay";
import { cn } from "@/lib/utils/cn";
import { SuggestTeamDrawer } from "./components/suggest-team-drawer";
import { MarketplaceAssignDrawer } from "./components/marketplace-assign-drawer";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import {
  AdminModal,
  Chip,
  TONE,
  primaryBtnClass,
  primaryStyle,
  secondaryBtnClass,
  type Tone,
} from "@/app/admin/_shell/aurora-ui";

function Section({
  title,
  description,
  action,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={cn(DASH_CARD, "overflow-hidden")}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-stroke-subtle">
        <div className="min-w-0">
          <h2 className="font-display text-[14px] font-bold tracking-[-0.01em] text-foreground">{title}</h2>
          {description ? <p className="mt-0.5 font-body text-[12px] text-text-tertiary">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function VitalCard({ label, value, sub, tone, pct }: { label: string; value: string; sub: string; tone: Tone; pct?: number }) {
  const accent = tone === "neutral" ? "var(--color-text-tertiary)" : TONE[tone].text;
  return (
    <div className={cn(DASH_CARD, "p-4")}>
      <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">{label}</p>
      <p className="mt-1.5 font-display text-[24px] font-bold text-foreground tabular-nums leading-none">{value}</p>
      {pct != null ? (
        <div className="mt-2.5 h-1.5 rounded-full bg-foreground/[0.08] overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: accent }} aria-hidden />
        </div>
      ) : null}
      <p className="mt-2 font-body text-[11.5px] leading-snug" style={{ color: accent }}>{sub}</p>
    </div>
  );
}

type Tab = "activity" | "delivery" | "team" | "exceptions" | "budget" | "audit";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "activity", label: "Activity" },
  { id: "delivery", label: "Delivery" },
  { id: "team", label: "Team" },
  { id: "exceptions", label: "Exceptions" },
  { id: "budget", label: "Budget" },
  { id: "audit", label: "Audit" },
];

const TAB_ALIASES: Record<string, Tab> = {
  overview: "activity",
  milestones: "delivery",
  tasks: "delivery",
};

const HEALTH_LABEL: Record<ProjectHealth, string> = {
  on_track: "On track",
  at_risk: "At risk",
  blocked: "Blocked",
  done: "Done",
};

const HEALTH_TONE: Record<ProjectHealth, Tone> = {
  on_track: "success",
  at_risk: "warning",
  blocked: "error",
  done: "neutral",
};

const MILESTONE_TONE: Record<ProjectMilestoneStatus, Tone> = {
  done: "success",
  on_track: "info",
  at_risk: "warning",
  blocked: "error",
  pending: "neutral",
};

const MILESTONE_STATUS_LABEL: Record<ProjectMilestoneStatus, string> = {
  done: "Done",
  on_track: "On track",
  at_risk: "At risk",
  blocked: "Blocked",
  pending: "Pending",
};

const MILESTONE_BAR: Record<ProjectMilestoneStatus, string> = {
  done: "var(--color-success-solid)",
  on_track: "var(--color-info-text)",
  at_risk: "var(--color-warning-solid)",
  blocked: "var(--color-error-solid)",
  pending: "var(--color-text-disabled)",
};

function fmtINR(minor: number): string {
  return `₹${Math.round(minor / 100).toLocaleString("en-IN")}`;
}

const GST_RATE = 0.18;

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return fmtDate(iso);
}

function resolveTab(raw: string | null): Tab {
  if (!raw) return "activity";
  if (TAB_ALIASES[raw]) return TAB_ALIASES[raw];
  if (TABS.some((t) => t.id === raw)) return raw as Tab;
  return "activity";
}

function canAssignTask(t: ProjectTaskRow): boolean {
  return (
    (t.assignee === "Unassigned" || !t.assignee) &&
    (t.state === "ready" || t.state === "matched")
  );
}

function tasksForMilestone(
  project: ProjectDetail,
  milestone: ProjectDetail["milestones"][number],
  index: number,
): ProjectTaskRow[] {
  const keys = new Set([
    milestone.id.toLowerCase(),
    milestone.name.toLowerCase(),
    `m${index + 1}`,
  ]);
  return project.tasks.filter((t) => keys.has(t.milestone.toLowerCase()));
}

function unassignedCount(project: ProjectDetail): number {
  return project.tasks.filter(canAssignTask).length;
}

/* ────────────────────────── page ────────────────────────── */

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  useOverlayVersion(projectOverlay);

  const project = params?.projectId ? getProjectMock(params.projectId) : undefined;
  const tabFromUrl = resolveTab(searchParams.get("tab"));
  const [tab, setTab] = React.useState<Tab>(tabFromUrl);

  React.useEffect(() => {
    setTab(resolveTab(searchParams.get("tab")));
  }, [searchParams]);

  const selectTab = (next: Tab) => {
    setTab(next);
    router.replace(`/enterprise/projects/${params.projectId}?tab=${next}`, { scroll: false });
  };

  if (!project) {
    return (
      <div className="space-y-4 pb-12 animate-fade-in">
        <BackLink />
        <div className={cn(DASH_CARD, "px-4 py-10 text-center")}>
          <p className="font-body text-[13px] font-semibold text-foreground">Project not found</p>
        </div>
      </div>
    );
  }

  return <ProjectDetailView project={project} tab={tab} onSelectTab={selectTab} />;
}

function ProjectDetailView({
  project,
  tab,
  onSelectTab,
}: {
  project: ProjectDetail;
  tab: Tab;
  onSelectTab: (tab: Tab) => void;
}) {
  const unassigned = unassignedCount(project);
  const openExceptions = project.openExceptions.length;

  const primaryAction =
    unassigned > 0
      ? { tab: "delivery" as Tab, label: `Assign tasks (${unassigned})` }
      : openExceptions > 0
        ? { tab: "exceptions" as Tab, label: `Review exceptions (${openExceptions})` }
        : null;

  const tabCounts: Partial<Record<Tab, number>> = {
    delivery: project.tasks.length,
    team: project.contributors.length + project.reviewers.length,
    exceptions: openExceptions,
    audit: project.audit.length,
  };

  const milestoneNames = project.milestones.map((m) => m.name).join(" → ");

  // ── Vital signs ──
  const progressPct = Math.round(project.progress * 100);
  const milestonesDone = project.milestones.filter((m) => m.status === "done").length;
  const budgetPct = project.budgetTotalMinor > 0 ? Math.round((project.budgetBurnMinor / project.budgetTotalMinor) * 100) : 0;
  const acceptancePct = Math.round(project.qualityAcceptanceRate * 100);
  const daysLeft = Math.ceil((new Date(project.dueAt).getTime() - Date.now()) / 86_400_000);
  const isDone = project.health === "done" || Boolean(project.completedAt);
  const overdue = daysLeft < 0 && !isDone;

  const scheduleTone: Tone = isDone ? "success" : overdue ? "error" : daysLeft <= 7 ? "warning" : "neutral";
  const budgetTone: Tone = budgetPct > 100 ? "error" : budgetPct >= 90 ? "warning" : "neutral";
  const qualityTone: Tone = acceptancePct >= 90 ? "success" : acceptancePct >= 75 ? "warning" : "error";

  const attentionItems: Array<{ icon: typeof Users; tone: Tone; label: string; sub: string; tab: Tab }> = [];
  if (unassigned > 0)
    attentionItems.push({ icon: Users, tone: "info", label: `${unassigned} task${unassigned === 1 ? "" : "s"} unassigned`, sub: "Match ranked contributors to start work", tab: "delivery" });
  if (openExceptions > 0)
    attentionItems.push({ icon: AlertTriangle, tone: "error", label: `${openExceptions} open exception${openExceptions === 1 ? "" : "s"}`, sub: "SLA breaches, blocked tasks, or overdue revisions", tab: "exceptions" });
  if (project.slaAtRiskCount > 0)
    attentionItems.push({ icon: Clock, tone: "warning", label: `${project.slaAtRiskCount} SLA at risk`, sub: "Tasks approaching their deadline", tab: "delivery" });

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <BackLink />

      <header className={cn(DASH_CARD, "p-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between")}>
        <div className="flex items-start gap-4 min-w-0">
          <span className="grid place-items-center h-12 w-12 rounded-lg text-white shrink-0" style={GLASS_GRADIENT} aria-hidden>
            <Briefcase className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
              Delivery project
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-[22px] sm:text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">
                {project.name}
              </h1>
              <Chip tone={HEALTH_TONE[project.health]}>{HEALTH_LABEL[project.health]}</Chip>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[12px] text-text-tertiary">
              <span>
                Sponsor <span className="font-medium text-text-secondary">{project.sponsor}</span>
              </span>
              <span aria-hidden>·</span>
              <span>
                PMO <span className="font-medium text-text-secondary">{project.pmo}</span>
              </span>
              <span aria-hidden>·</span>
              <span className="tabular-nums">
                {fmtDate(project.startedAt)} → {fmtDate(project.dueAt)}
              </span>
            </div>
            <RecordLinks project={project} />
          </div>
        </div>

        {primaryAction ? (
          <button type="button" onClick={() => onSelectTab(primaryAction.tab)} style={primaryStyle} className={cn(primaryBtnClass, "h-9 px-5 shrink-0")}>
            <Send className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            {primaryAction.label}
          </button>
        ) : null}
      </header>

      {/* Vital signs — the at-a-glance "is this project healthy?" answer */}
      <section aria-label="Project health" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <VitalCard label="Progress" value={`${progressPct}%`} pct={progressPct} tone={HEALTH_TONE[project.health]} sub={`${milestonesDone}/${project.milestones.length} milestones done`} />
        <VitalCard label="Schedule" value={isDone ? "Delivered" : overdue ? `${Math.abs(daysLeft)}d over` : `${daysLeft}d left`} tone={scheduleTone} sub={`Due ${fmtDate(project.dueAt)}`} />
        <VitalCard label="Budget" value={`${budgetPct}%`} pct={budgetPct} tone={budgetTone} sub={`${fmtINR(project.budgetBurnMinor)} of ${fmtINR(project.budgetTotalMinor)}`} />
        <VitalCard label="Quality" value={`${acceptancePct}%`} pct={acceptancePct} tone={qualityTone} sub={project.slaAtRiskCount > 0 ? `acceptance · ${project.slaAtRiskCount} SLA at risk` : "acceptance rate"} />
      </section>

      {/* Needs attention — consolidated action queue */}
      {attentionItems.length > 0 ? (
        <Section title="Needs attention" description="Items waiting on you">
          <ul className="divide-y divide-stroke-subtle">
            {attentionItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => onSelectTab(item.tab)}
                    className="w-full flex items-center gap-3 px-5 sm:px-6 py-3 text-left hover:bg-bg-subtle/60 transition-colors group"
                  >
                    <span className="grid place-items-center h-8 w-8 rounded-lg shrink-0" style={{ background: TONE[item.tone].soft, color: TONE[item.tone].text }} aria-hidden>
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-body text-[13.5px] font-semibold text-foreground">{item.label}</span>
                      <span className="block font-body text-[12px] text-text-tertiary mt-0.5">{item.sub}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-text-disabled group-hover:text-text-secondary shrink-0 transition-colors" strokeWidth={2} aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}

      <Section
        title="Milestone progress"
        description={milestoneNames || "No milestones yet"}
      >
        <div className="px-5 sm:px-6 py-5">
          <MilestoneStepper milestones={project.milestones} />
        </div>
      </Section>

      <Section title="Project details" description="Metadata for this delivery project">
        <dl className="px-5 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <Fact label="Project ID" value={project.id} mono />
          {project.planId && (
            <SourcePlanFact planId={project.planId} />
          )}
          {project.sowId && (
            <SourceSowFact sowId={project.sowId} />
          )}
          <Fact label="Sponsor" value={project.sponsor} />
          <Fact label="PMO" value={project.pmo} />
          <Fact label="Started" value={fmtDate(project.startedAt)} mono />
          <Fact label="Due" value={fmtDate(project.dueAt)} mono />
          {project.completedAt && (
            <Fact label="Completed" value={fmtDate(project.completedAt)} mono />
          )}
          <Fact
            label="Tasks"
            value={`${project.tasks.length} total · ${unassigned} unassigned`}
            mono
          />
          <Fact
            label="Budget"
            value={`${fmtINR(project.budgetBurnMinor)} of ${fmtINR(project.budgetTotalMinor)}`}
            mono
          />
        </dl>
      </Section>

      <section className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="px-4 sm:px-5 py-3 border-b border-stroke-subtle overflow-x-auto">
          <nav aria-label="Project sections" className="flex flex-wrap gap-1.5">
            {TABS.map((t) => {
              const active = tab === t.id;
              const count = tabCounts[t.id];
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTab(t.id)}
                  aria-current={active ? "page" : undefined}
                  style={active ? GLASS_GRADIENT : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg font-body text-[13px] font-semibold whitespace-nowrap transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
                    active ? "text-white" : "text-text-secondary hover:text-foreground hover:bg-bg-subtle",
                  )}
                >
                  {t.label}
                  {count != null && count > 0 ? (
                    <span
                      className={cn(
                        "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md font-mono text-[10px] font-bold tabular-nums",
                        active
                          ? "bg-white/25 text-white"
                          : t.id === "exceptions"
                            ? "bg-warning-subtle text-warning-text"
                            : "bg-bg-subtle text-text-tertiary",
                      )}
                    >
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        <div role="tabpanel" className="px-5 sm:px-6 py-4">
          {tab === "activity" && <ActivityPanel project={project} />}
          {tab === "delivery" && <DeliveryPanel project={project} />}
          {tab === "team" && <TeamPanel project={project} />}
          {tab === "exceptions" && <ExceptionsPanel project={project} />}
          {tab === "budget" && <BudgetPanel project={project} />}
          {tab === "audit" && <AuditPanel project={project} />}
        </div>
      </section>
    </div>
  );
}

/* ────────────────────────── shared chrome ────────────────────────── */

function BackLink() {
  return (
    <Link
      href="/enterprise/projects"
      className="inline-flex items-center gap-1 font-body text-[12px] font-medium text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm"
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      Back to projects
    </Link>
  );
}

function RecordLinks({ project }: { project: ProjectDetail }) {
  const auditHref = `/enterprise/audit?resourceType=project&resourceId=${encodeURIComponent(project.id)}`;

  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link
        href={auditHref}
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Audit trail
      </Link>
      {project.planId && (
        <>
          <span aria-hidden className="text-text-disabled">·</span>
          <Link
            href={`/enterprise/decomposition/${project.planId}`}
            className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
          >
            Source plan
          </Link>
        </>
      )}
      {project.sowId && (
        <>
          <span aria-hidden className="text-text-disabled">·</span>
          <Link
            href={`/enterprise/sow/${project.sowId}`}
            className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
          >
            Source SOW
          </Link>
        </>
      )}
    </p>
  );
}

function Fact({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[13px] text-foreground",
          mono && "font-mono text-[12px] tabular-nums",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function SourcePlanFact({ planId }: { planId: string }) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        Source plan
      </dt>
      <dd className="mt-1">
        <Link
          href={`/enterprise/decomposition/${planId}`}
          className="font-body text-[13px] font-medium text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
        >
          Decomposition plan
        </Link>
        <p className="mt-0.5 font-mono text-[11px] text-text-tertiary tabular-nums">{planId}</p>
      </dd>
    </div>
  );
}

function SourceSowFact({ sowId }: { sowId: string }) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        Source SOW
      </dt>
      <dd className="mt-1">
        <Link
          href={`/enterprise/sow/${sowId}`}
          className="font-body text-[13px] font-medium text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
        >
          View SOW
        </Link>
        <p className="mt-0.5 font-mono text-[11px] text-text-tertiary tabular-nums">{sowId}</p>
      </dd>
    </div>
  );
}

/* ────────────────────────── milestone stepper ────────────────────────── */

type MilestoneStageState = "completed" | "current" | "waiting" | "at_risk" | "blocked";

function resolveMilestoneState(status: ProjectMilestoneStatus): MilestoneStageState {
  switch (status) {
    case "done":
      return "completed";
    case "on_track":
      return "current";
    case "at_risk":
      return "at_risk";
    case "blocked":
      return "blocked";
    case "pending":
    default:
      return "waiting";
  }
}

function MilestoneStepper({ milestones }: { milestones: ProjectDetail["milestones"] }) {
  if (milestones.length === 0) {
    return (
      <p className="font-body text-[13px] text-text-tertiary">No milestones on this project yet.</p>
    );
  }

  return (
    <ol className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-2">
      {milestones.map((m, i) => {
        const state = resolveMilestoneState(m.status);
        return (
          <li key={m.id} className="relative min-w-0">
            {i < milestones.length - 1 && (
              <span
                aria-hidden
                className="hidden sm:block absolute top-3 left-[calc(50%+12px)] right-0 h-px bg-foreground/[0.10]"
              />
            )}
            <MilestoneNode milestone={m} state={state} />
          </li>
        );
      })}
    </ol>
  );
}

function MilestoneNode({
  milestone,
  state,
}: {
  milestone: ProjectDetail["milestones"][number];
  state: MilestoneStageState;
}) {
  const Icon =
    state === "completed"
      ? CheckCircle2
      : state === "current"
        ? Clock
        : state === "blocked"
          ? XCircle
          : state === "at_risk"
            ? AlertTriangle
            : Circle;

  const iconCls =
    state === "completed"
      ? "text-success-text"
      : state === "current"
        ? "text-[var(--c-violet-500)]"
        : state === "blocked"
          ? "text-error-text"
          : state === "at_risk"
            ? "text-warning-text"
            : "text-text-disabled";

  const caption = milestone.status.replace(/_/g, " ");

  return (
    <div className="flex sm:flex-col sm:items-center gap-2 sm:gap-1.5 sm:text-center">
      <span
        className={cn(
          "grid place-items-center h-6 w-6 rounded-full border shrink-0",
          state === "current" && "border-[var(--c-violet-400)] bg-[var(--color-ai-surface)]",
          state === "completed" && "border-success-border bg-success-subtle",
          state === "waiting" && "border-stroke-subtle bg-bg-subtle",
          state === "at_risk" && "border-warning-border bg-warning-subtle",
          state === "blocked" && "border-error-border bg-error-subtle",
        )}
      >
        <Icon className={cn("h-3.5 w-3.5", iconCls)} strokeWidth={2} aria-hidden />
      </span>
      <div className="min-w-0 flex-1 sm:flex-none">
        <p className="font-body text-[12px] font-semibold text-foreground truncate">{milestone.name}</p>
        <p
          className={cn(
            "font-body text-[10.5px] truncate tabular-nums",
            state === "current" ? "text-[var(--c-violet-500)] font-medium" : "text-text-tertiary",
          )}
        >
          {Math.round(milestone.progress * 100)}% · {caption}
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────── activity tab ────────────────────────── */

function ActivityPanel({ project }: { project: ProjectDetail }) {
  return (
    <div className="space-y-6 -mx-5 sm:-mx-6">
      <SectionBlock title="Recent activity" count={project.recentActivity.length}>
        {project.recentActivity.length === 0 ? (
          <EmptyLine>No activity yet.</EmptyLine>
        ) : (
          <ul className="divide-y divide-stroke-subtle border-t border-stroke-subtle">
            {project.recentActivity.map((a) => (
              <li key={a.id} className="px-5 sm:px-6 py-2.5 flex items-center justify-between gap-3">
                <span className="font-body text-[12.5px] text-text-secondary min-w-0 truncate">
                  {a.text}
                </span>
                <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums shrink-0">
                  {timeAgo(a.ts)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionBlock>

      {project.aiSignals.length > 0 && (
        <SectionBlock
          title="AI signals"
          titleIcon={
            <Sparkles className="h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
          }
          count={project.aiSignals.length}
        >
          <ul className="divide-y divide-stroke-subtle border-t border-stroke-subtle">
            {project.aiSignals.map((s) => (
              <li key={s.id} className="px-5 sm:px-6 py-2.5 flex items-start gap-2">
                <span
                  aria-hidden
                  className={cn(
                    "h-1.5 w-1.5 rounded-full shrink-0 mt-1.5",
                    s.tone === "critical"
                      ? "bg-error-text"
                      : s.tone === "warning"
                        ? "bg-warning-text"
                        : "bg-[var(--c-violet-500)]",
                  )}
                />
                <span className="font-body text-[12.5px] text-text-secondary">{s.text}</span>
              </li>
            ))}
          </ul>
        </SectionBlock>
      )}
    </div>
  );
}

/* ────────────────────────── delivery tab ────────────────────────── */

function DeliveryPanel({ project }: { project: ProjectDetail }) {
  const [assignTask, setAssignTask] = React.useState<ProjectTaskRow | null>(null);
  const gated = project.milestones.some((m) => m.paymentStatus != null);

  return (
    <>
      {project.milestones.length === 0 && project.tasks.length === 0 ? (
        <EmptyLine>No milestones or tasks on this project yet.</EmptyLine>
      ) : (
        <div className="space-y-4">
          {project.milestones.map((m, i) => {
            const tasks = tasksForMilestone(project, m, i);
            const pct = Math.round(m.progress * 100);
            return (
              <div key={m.id} className="rounded-xl border border-stroke-subtle overflow-hidden">
                {/* Milestone header */}
                <div className="px-4 py-3 border-b border-stroke-subtle bg-bg-subtle/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="grid place-items-center h-6 px-1.5 rounded-md bg-surface border border-stroke-subtle font-mono text-[10.5px] font-bold text-text-secondary shrink-0">
                        M{i + 1}
                      </span>
                      <p className="font-display text-[14px] font-bold text-foreground truncate">{m.name}</p>
                      <Chip tone={MILESTONE_TONE[m.status]} dot={false}>{MILESTONE_STATUS_LABEL[m.status]}</Chip>
                    </div>
                    {m.amountMinor != null ? (
                      <span className="font-mono text-[12px] tabular-nums text-text-secondary shrink-0 mt-0.5">{fmtINR(m.amountMinor)}</span>
                    ) : null}
                  </div>
                  <div className="mt-2.5 flex items-center gap-2.5">
                    <div className="h-1.5 flex-1 rounded-full bg-foreground/[0.08] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: MILESTONE_BAR[m.status] }} aria-hidden />
                    </div>
                    <span className="font-mono text-[11px] tabular-nums text-text-tertiary shrink-0">{pct}%</span>
                    <span className="font-body text-[11px] text-text-tertiary shrink-0">
                      {tasks.length} task{tasks.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  {m.note ? <p className="mt-1.5 font-body text-[12px] text-text-secondary">{m.note}</p> : null}
                </div>

                {/* Milestone payment */}
                {m.paymentStatus != null ? <MilestonePaymentRow projectId={project.id} milestone={m} /> : null}

                {/* Tasks */}
                {tasks.length === 0 ? (
                  <p className="px-4 py-3 font-body text-[12px] text-text-tertiary italic">No tasks in this milestone.</p>
                ) : (
                  <ul className="divide-y divide-stroke-subtle">
                    {tasks.map((task) => (
                      <TaskRow key={task.id} project={project} task={task} onAssign={() => setAssignTask(task)} />
                    ))}
                  </ul>
                )}
              </div>
            );
          })}

          {gated ? (
            <p className="font-body text-[11px] text-text-tertiary leading-relaxed">
              How payment works: a contributor submits → Glimmora mentor reviews → you accept the milestone → you pay.
              Paying releases each contributor&apos;s payout in Finance → Payouts.
            </p>
          ) : null}
        </div>
      )}

      {assignTask && (
        <MarketplaceAssignDrawer
          open
          onClose={() => setAssignTask(null)}
          projectId={project.id}
          projectName={project.name}
          taskId={assignTask.id}
          taskTitle={assignTask.title}
          requiredSkills={assignTask.requiredSkills ?? ["TypeScript"]}
          effortHours={assignTask.effortHours}
          onAssigned={() => setAssignTask(null)}
        />
      )}
    </>
  );
}

const TASK_STATE_TONE: Record<string, Tone> = {
  blocked: "error",
  submitted: "warning",
  reviewed: "warning",
  done: "success",
  accepted: "success",
};

function TaskRow({
  project,
  task,
  onAssign,
}: {
  project: ProjectDetail;
  task: ProjectTaskRow;
  onAssign: () => void;
}) {
  const assignable = canAssignTask(task);
  const unassigned = task.assignee === "Unassigned" || !task.assignee;
  const stateLabel = task.state.replace(/_/g, " ");
  const stateTone = TASK_STATE_TONE[task.state] ?? "neutral";

  return (
    <li className="flex items-center gap-3 px-4 py-3 min-h-[48px] hover:bg-bg-subtle/50 transition-colors duration-fast">
      <Link
        href={`/enterprise/projects/${project.id}/tasks/${task.id}`}
        className="min-w-0 flex-1 font-body text-[13px] font-semibold text-foreground truncate hover:text-text-link transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm"
        title={task.title}
      >
        {task.title}
      </Link>

      <div className="flex items-center gap-2.5 shrink-0">
        <span className="font-body text-[11.5px] text-text-tertiary tabular-nums hidden sm:inline">{task.effortHours}h</span>
        <Chip tone={stateTone} dot={false}>{stateLabel}</Chip>
        {assignable ? (
          <button type="button" onClick={onAssign} style={primaryStyle} className={cn(primaryBtnClass, "h-7 px-3 text-[11.5px]")}>
            Assign
          </button>
        ) : (
          <span className={cn("font-body text-[12px] truncate max-w-[120px] text-right", unassigned ? "text-text-disabled italic" : "text-text-secondary font-medium")}>
            {unassigned ? "Unassigned" : task.assignee}
          </span>
        )}
      </div>
    </li>
  );
}

function MilestonePaymentRow({
  projectId,
  milestone,
}: {
  projectId: string;
  milestone: ProjectDetail["milestones"][number];
}) {
  const [busy, setBusy] = React.useState<"accept" | "pay" | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const status = milestone.paymentStatus ?? "locked";
  // Markup model: the milestone amount is the client price (excl. GST, margin
  // already inside it). GST is added ON TOP — the enterprise pays base + 18%.
  const amountExcludingGstMinor = milestone.amountMinor ?? 0;
  const gstMinor = Math.round(amountExcludingGstMinor * GST_RATE);
  const totalPayableMinor = amountExcludingGstMinor + gstMinor;

  const accept = () => {
    setBusy("accept");
    setErr(null);
    try {
      acceptProjectMilestoneMock(projectId, milestone.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  };
  const pay = () => {
    setBusy("pay");
    setErr(null);
    try {
      payProjectMilestoneMock(projectId, milestone.id);
      return true;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
      return false;
    } finally {
      setBusy(null);
    }
  };
  const confirmAndPay = () => {
    const ok = pay();
    if (ok) setConfirmOpen(false);
  };

  const lineCount = milestone.lineItems?.length ?? 0;
  const payoutsLabel = lineCount > 0 ? `${lineCount} contributor payout${lineCount === 1 ? "" : "s"}` : "";

  const stateMeta =
    status === "paid"
      ? {
          icon: CheckCircle2,
          tone: "success" as Tone,
          title: "Paid",
          sub: [milestone.paidAt ? timeAgo(milestone.paidAt) : null, payoutsLabel ? `${payoutsLabel} released` : null].filter(Boolean).join(" · ") || "Payment released",
        }
      : status === "payable"
        ? {
            icon: Wallet,
            tone: "info" as Tone,
            title: "Ready to pay",
            sub: [payoutsLabel || null, `${fmtINR(totalPayableMinor)} incl. GST`].filter(Boolean).join(" · "),
          }
        : {
            icon: Clock,
            tone: "warning" as Tone,
            title: "Awaiting your acceptance",
            sub: [payoutsLabel || null, "Accept the delivered work to release payment"].filter(Boolean).join(" · "),
          };
  const StateIcon = stateMeta.icon;

  return (
    <div className="px-4 py-3 border-b border-stroke-subtle bg-bg-subtle/30 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="grid place-items-center h-8 w-8 rounded-lg shrink-0" style={{ background: TONE[stateMeta.tone].soft, color: TONE[stateMeta.tone].text }} aria-hidden>
          <StateIcon className="h-4 w-4" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="font-body text-[12.5px] font-semibold text-foreground">{stateMeta.title}</p>
          <p className="font-body text-[11.5px] text-text-tertiary">{stateMeta.sub}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {err ? (
          <span role="alert" className="font-body text-[11px] text-error-text">
            {err}
          </span>
        ) : null}
        {status === "locked" ? (
          <button type="button" onClick={accept} disabled={busy !== null} className={cn(secondaryBtnClass, "h-8 px-3.5 text-[12.5px]")}>
            {busy === "accept" ? "Accepting…" : "Accept milestone"}
          </button>
        ) : null}
        {status === "payable" ? (
          <button type="button" onClick={() => setConfirmOpen(true)} disabled={busy !== null} style={primaryStyle} className={cn(primaryBtnClass, "h-8 px-4 text-[12.5px]")}>
            <Wallet className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
            {busy === "pay" ? "Paying…" : `Pay ${fmtINR(totalPayableMinor)}`}
          </button>
        ) : null}
      </div>

      {status === "payable" && (
        <AdminModal
          open={confirmOpen}
          onClose={() => {
            if (busy === null) setConfirmOpen(false);
          }}
          icon={Wallet}
          tone="ai"
          title="Confirm milestone payment"
          description="Review before releasing payouts to contributors."
          footer={
            <>
              <button type="button" onClick={() => setConfirmOpen(false)} disabled={busy !== null} className={secondaryBtnClass}>
                Cancel
              </button>
              <button type="button" onClick={confirmAndPay} disabled={busy !== null} style={primaryStyle} className={cn(primaryBtnClass, "px-5")}>
                <Wallet className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                {busy === "pay" ? "Paying…" : `Confirm & pay ${fmtINR(totalPayableMinor)}`}
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/40 p-3.5 space-y-2">
              <p className="font-body text-[12.5px] font-semibold text-foreground">{milestone.name}</p>
              <div className="flex items-center justify-between font-body text-[12.5px] text-text-secondary">
                <span>Amount (excl. GST)</span>
                <span className="font-mono tabular-nums">{fmtINR(amountExcludingGstMinor)}</span>
              </div>
              <div className="flex items-center justify-between font-body text-[12.5px] text-text-secondary">
                <span>GST ({Math.round(GST_RATE * 100)}%)</span>
                <span className="font-mono tabular-nums">{fmtINR(gstMinor)}</span>
              </div>
              <div className="border-t border-stroke-subtle pt-2 flex items-center justify-between">
                <span className="font-body text-[13px] font-semibold text-foreground">Total payable</span>
                <span className="font-mono text-[14px] font-bold tabular-nums text-foreground">{fmtINR(totalPayableMinor)}</span>
              </div>
            </div>
            <p className="font-body text-[11.5px] text-text-tertiary leading-relaxed">
              Payouts for assigned contributors are released after this payment succeeds.
            </p>
          </div>
        </AdminModal>
      )}
    </div>
  );
}

/* ────────────────────────── team tab ────────────────────────── */

function TeamPanel({ project }: { project: ProjectDetail }) {
  const [suggestOpen, setSuggestOpen] = React.useState(false);

  return (
    <div className="space-y-6 -mx-5 sm:-mx-6">
      <div className="px-5 sm:px-6 flex flex-wrap items-center justify-between gap-2">
        <p className="font-body text-[12px] text-text-secondary">
          AI suggests candidates ranked by skills × availability × quality.
        </p>
        <button
          type="button"
          onClick={() => setSuggestOpen(true)}
          style={primaryStyle}
          className={cn(primaryBtnClass, "h-8 px-3 text-[12.5px]")}
        >
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
          Suggest team
        </button>
      </div>
      <SuggestTeamDrawer
        open={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        projectName={project.name}
      />

      <SectionBlock title="Contributors" count={project.contributors.length}>
        {project.contributors.length === 0 ? (
          <EmptyLine>No contributors yet.</EmptyLine>
        ) : (
          <ul className="divide-y divide-stroke-subtle border-t border-stroke-subtle">
            {project.contributors.map((c) => (
              <li key={c.id} className="px-5 sm:px-6 py-2.5 flex items-center gap-3">
                <Avatar name={c.name} />
                <span className="font-body text-[13px] font-medium text-foreground flex-1 min-w-0 truncate">
                  {c.name}
                </span>
                <span className="font-body text-[11px] text-text-tertiary shrink-0 text-right">
                  {c.role} · {c.level} · {c.taskCount} tasks · acc{" "}
                  {Math.round(c.acceptanceRate * 100)}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionBlock>

      <SectionBlock title="Reviewers" count={project.reviewers.length}>
        {project.reviewers.length === 0 ? (
          <EmptyLine>No reviewers assigned.</EmptyLine>
        ) : (
          <ul className="divide-y divide-stroke-subtle border-t border-stroke-subtle">
            {project.reviewers.map((r) => (
              <li key={r.id} className="px-5 sm:px-6 py-2.5 flex items-center gap-3">
                <Avatar name={r.name} />
                <span className="font-body text-[13px] font-medium text-foreground flex-1 min-w-0 truncate">
                  {r.name}
                </span>
                <span className="font-body text-[11px] text-text-tertiary shrink-0">
                  {r.kind === "mentor" ? "Mentor" : "Internal reviewer"} · {r.reviewedCount}{" "}
                  reviewed
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionBlock>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden
      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-stroke-subtle bg-bg-subtle text-text-secondary font-body text-[11px] font-semibold shrink-0"
    >
      {initials}
    </span>
  );
}

/* ────────────────────────── exceptions tab ────────────────────────── */

function ExceptionsPanel({ project }: { project: ProjectDetail }) {
  const [toast, setToast] = React.useState<string | null>(null);
  const act = (label: string, ex: { task: string; taskId: string }) => {
    setToast(`${label} requested for ${ex.task} (${ex.taskId}). Audit event recorded.`);
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="space-y-6 -mx-5 sm:-mx-6 relative">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={cn(DASH_CARD, "fixed bottom-6 right-6 z-50 max-w-md px-4 py-3 flex items-start gap-2.5")}
        >
          <CheckCircle2 className="h-4 w-4 text-success-text mt-0.5 shrink-0" strokeWidth={2.5} aria-hidden />
          <p className="font-body text-[12.5px] text-foreground">{toast}</p>
        </div>
      )}

      <SectionBlock title="Open" count={project.openExceptions.length}>
        {project.openExceptions.length === 0 ? (
          <EmptyLine>No open exceptions.</EmptyLine>
        ) : (
          <ul className="divide-y divide-stroke-subtle border-t border-stroke-subtle">
            {project.openExceptions.map((ex) => (
              <li key={ex.id} className="px-5 sm:px-6 py-3 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <AlertTriangle
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      ex.kind === "blocked" ? "text-error-text" : "text-warning-text",
                    )}
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span className="font-body text-[13px] font-medium text-foreground truncate">
                    {ex.task}
                  </span>
                  <span className="font-body text-[10.5px] font-bold uppercase tracking-wide text-text-tertiary">
                    {ex.kind.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="font-body text-[12px] text-text-secondary">{ex.detail}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <ExceptionAction
                    icon={<Clock className="h-3 w-3" strokeWidth={2} aria-hidden />}
                    label="Extend SLA"
                    onClick={() => act("Extend SLA", ex)}
                  />
                  <ExceptionAction
                    icon={<Users className="h-3 w-3" strokeWidth={2} aria-hidden />}
                    label="Reassign"
                    onClick={() => act("Reassign", ex)}
                  />
                  <ExceptionAction
                    icon={<ChevronUp className="h-3 w-3" strokeWidth={2} aria-hidden />}
                    label="Escalate to mentor"
                    onClick={() => act("Escalate", ex)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionBlock>

      {project.resolvedExceptions.length > 0 && (
        <SectionBlock title="Resolved" count={project.resolvedExceptions.length}>
          <ul className="divide-y divide-stroke-subtle border-t border-stroke-subtle">
            {project.resolvedExceptions.map((ex) => (
              <li key={ex.id} className="px-5 sm:px-6 py-2.5 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-success-text shrink-0" strokeWidth={2} aria-hidden />
                <span className="font-body text-[12.5px] text-text-secondary flex-1 min-w-0 truncate">
                  {ex.task} · {ex.detail}
                </span>
                {ex.resolvedAt && (
                  <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums shrink-0">
                    {fmtDate(ex.resolvedAt)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </SectionBlock>
      )}
    </div>
  );
}

function ExceptionAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 h-6 px-2 rounded-lg bg-bg-subtle border border-stroke-subtle font-body text-[11.5px] font-semibold text-foreground hover:bg-bg-subtle transition-colors duration-fast"
    >
      {icon}
      {label}
    </button>
  );
}

/* ────────────────────────── budget tab ────────────────────────── */

function BudgetPanel({ project }: { project: ProjectDetail }) {
  const b = project.budget;

  return (
    <div className="space-y-6 -mx-5 sm:-mx-6">
      <dl className="px-5 sm:px-6 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
        <Fact label="Budget" value={fmtINR(b.budgetMinor)} mono />
        <Fact label="Committed" value={fmtINR(b.committedMinor)} mono />
        <Fact label="Paid" value={fmtINR(b.paidMinor)} mono />
        <Fact label="Pending" value={fmtINR(b.pendingMinor)} mono />
        <Fact
          label="Forecast"
          value={fmtINR(b.forecastMinor)}
          mono
        />
        <Fact
          label="Forecast delta"
          value={
            b.forecastDeltaPct === 0
              ? "On budget"
              : `${b.forecastDeltaPct > 0 ? "+" : ""}${Math.round(b.forecastDeltaPct * 100)}%`
          }
          mono
        />
      </dl>

      {b.byMilestone.length > 0 && (
        <SectionBlock title="By milestone" count={b.byMilestone.length}>
          <ul className="divide-y divide-stroke-subtle border-t border-stroke-subtle">
            {b.byMilestone.map((m, i) => (
              <li key={i} className="px-5 sm:px-6 py-2.5 flex items-center justify-between gap-3">
                <span className="font-body text-[12.5px] text-foreground truncate">{m.milestone}</span>
                <span className="font-body text-[11px] text-text-tertiary shrink-0 tabular-nums">
                  {fmtINR(m.committedMinor)} committed · {fmtINR(m.paidMinor)} paid ·{" "}
                  {Math.round(m.closedPct * 100)}% closed
                </span>
              </li>
            ))}
          </ul>
        </SectionBlock>
      )}

      {b.byRole.length > 0 && (
        <SectionBlock title="By role" count={b.byRole.length}>
          <ul className="divide-y divide-stroke-subtle border-t border-stroke-subtle">
            {b.byRole.map((r, i) => (
              <li key={i} className="px-5 sm:px-6 py-2.5 flex items-center justify-between gap-3">
                <span className="font-body text-[12.5px] text-foreground truncate">{r.role}</span>
                <span className="font-body text-[11px] text-text-tertiary shrink-0 tabular-nums">
                  {fmtINR(r.amountMinor)} ({Math.round(r.sharePct * 100)}%)
                </span>
              </li>
            ))}
          </ul>
        </SectionBlock>
      )}
    </div>
  );
}

/* ────────────────────────── audit tab ────────────────────────── */

function AuditPanel({ project }: { project: ProjectDetail }) {
  return (
    <div className="-mx-5 sm:-mx-6">
      {project.audit.length === 0 ? (
        <EmptyLine>
          No audit events for this project yet.{" "}
          <Link href="/enterprise/audit" className="text-text-secondary not-italic hover:text-foreground hover:underline transition-colors duration-fast">
            Open audit log
          </Link>
          .
        </EmptyLine>
      ) : (
        <ul className="divide-y divide-stroke-subtle border-t border-stroke-subtle">
          {project.audit.map((a) => (
            <li key={a.id} className="px-5 sm:px-6 py-2.5 flex items-center gap-3 flex-wrap">
              <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums shrink-0">
                {new Date(a.ts).toLocaleString("en-GB", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="font-mono text-[11px] text-foreground">{a.action}</span>
              <span className="font-body text-[11.5px] text-text-secondary truncate flex-1 min-w-0">
                {a.actor}
              </span>
              <span className="font-mono text-[10.5px] text-text-tertiary truncate">
                {a.resource}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ────────────────────────── tab section helpers ────────────────────────── */

function SectionBlock({
  title,
  count,
  titleIcon,
  children,
}: {
  title: string;
  count?: number;
  titleIcon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="px-5 sm:px-6 py-2 flex items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-1.5 font-body text-[11px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
          {titleIcon}
          {title}
          {count != null && (
            <span className="font-mono tabular-nums text-foreground normal-case tracking-normal">
              {count}
            </span>
          )}
        </h3>
      </div>
      {children}
    </div>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-5 sm:px-6 py-6 font-body text-[12.5px] text-text-tertiary italic">{children}</p>
  );
}
