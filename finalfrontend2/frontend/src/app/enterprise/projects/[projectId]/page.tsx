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
  Loader2,
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  Users,
  ChevronUp,
  XCircle,
  Send,
} from "lucide-react";
import type {
  ProjectDetail,
  ProjectHealth,
  ProjectMilestoneStatus,
  ProjectTaskRow,
} from "@/lib/projects/projects-mock";
import { getEnterpriseProject } from "@/lib/api/enterprise-projects";
import { fetchInternal } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import { SuggestTeamDrawer } from "./components/suggest-team-drawer";
import { MarketplaceAssignDrawer } from "./components/marketplace-assign-drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AURORA_ACCENT, GLASS_CARD, GLASS_SHADOW } from "@/app/admin/_shell/aurora";
import {
  SectionCard,
  Chip,
  TONE,
  primaryBtnClass,
  primaryStyle,
  ghostBtnClass,
  GLASS_MODAL_CLASS,
  type Tone,
} from "@/app/admin/_shell/aurora-ui";

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

  const [project, setProject] = React.useState<ProjectDetail | null | undefined>(undefined);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const tabFromUrl = resolveTab(searchParams.get("tab"));
  const [tab, setTab] = React.useState<Tab>(tabFromUrl);

  React.useEffect(() => {
    setTab(resolveTab(searchParams.get("tab")));
  }, [searchParams]);

  React.useEffect(() => {
    const id = params?.projectId;
    if (!id) return;
    let cancelled = false;
    setProject(undefined);
    setLoadError(null);
    getEnterpriseProject(id)
      .then((p) => {
        if (!cancelled) setProject(p);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Failed to load project");
          setProject(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [params?.projectId]);

  const selectTab = (next: Tab) => {
    setTab(next);
    router.replace(`/enterprise/projects/${params?.projectId}?tab=${next}`, { scroll: false });
  };

  // Still loading
  if (project === undefined && !loadError) {
    return (
      <div className="space-y-4 pb-12 animate-fade-in">
        <BackLink />
        <div className={cn(GLASS_CARD, "px-4 py-14 text-center")} style={GLASS_SHADOW}>
          <Loader2 className="h-5 w-5 mx-auto text-text-tertiary animate-spin mb-2" strokeWidth={2} aria-hidden />
          <p className="font-body text-[13px] text-text-tertiary">Loading project…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4 pb-12 animate-fade-in">
        <BackLink />
        <div className={cn(GLASS_CARD, "px-4 py-10 text-center")} style={GLASS_SHADOW}>
          <p className="font-body text-[13px] font-semibold text-foreground">Could not load project</p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-4 pb-12 animate-fade-in">
        <BackLink />
        <div className={cn(GLASS_CARD, "px-4 py-10 text-center")} style={GLASS_SHADOW}>
          <p className="font-body text-[13px] font-semibold text-foreground">Project not found</p>
        </div>
      </div>
    );
  }

  return <ProjectDetailView project={project} tab={tab} onSelectTab={selectTab} onProjectUpdate={setProject} />;
}

function ProjectDetailView({
  project,
  tab,
  onSelectTab,
  onProjectUpdate,
}: {
  project: ProjectDetail;
  tab: Tab;
  onSelectTab: (tab: Tab) => void;
  onProjectUpdate?: (p: ProjectDetail) => void;
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

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <BackLink />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Project · {Math.round(project.progress * 100)}% complete
          </p>
          <h1 className="font-display text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
            {project.name}
          </h1>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[12px] text-text-tertiary">
            <Chip tone={HEALTH_TONE[project.health]}>{HEALTH_LABEL[project.health]}</Chip>
            <span aria-hidden>·</span>
            <span>
              Sponsor{" "}
              <span className="font-medium text-text-secondary">{project.sponsor}</span>
            </span>
            <span aria-hidden>·</span>
            <span>
              PMO <span className="font-medium text-text-secondary">{project.pmo}</span>
            </span>
            <span aria-hidden>·</span>
            <span className="tabular-nums">
              {fmtDate(project.startedAt)} → {fmtDate(project.dueAt)}
            </span>
            {project.slaAtRiskCount > 0 && (
              <>
                <span aria-hidden>·</span>
                <span className="text-warning-text font-medium tabular-nums">
                  {project.slaAtRiskCount} SLA at risk
                </span>
              </>
            )}
            <span aria-hidden>·</span>
            <span className="tabular-nums">
              {Math.round(project.qualityAcceptanceRate * 100)}% acceptance
            </span>
            <span aria-hidden>·</span>
            <span className="tabular-nums">
              {fmtINR(project.budgetBurnMinor)} / {fmtINR(project.budgetTotalMinor)} burn
            </span>
          </div>
          <RecordLinks project={project} />
        </div>

        {primaryAction && (
          <button
            type="button"
            onClick={() => onSelectTab(primaryAction.tab)}
            style={primaryStyle}
            className={cn(primaryBtnClass, "h-9")}
          >
            <Send className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
            {primaryAction.label}
          </button>
        )}
      </header>

      {(project.health === "at_risk" || project.health === "blocked") && (
        <ContextBanner tone="error" title={HEALTH_LABEL[project.health]}>
          {project.health === "blocked"
            ? "One or more milestones or tasks are blocked. Review delivery and exceptions to unblock progress."
            : "SLA or quality signals need attention. Check exceptions and at-risk tasks in Delivery."}
        </ContextBanner>
      )}

      {unassigned > 0 && (
        <ContextBanner tone="brand" title={`${unassigned} task${unassigned === 1 ? "" : "s"} unassigned`}>
          Match ranked contributors per task in Delivery. After assignment, contributors review price first and
          then show interest before work begins.
        </ContextBanner>
      )}

      {openExceptions > 0 && (
        <ContextBanner tone="error" title={`${openExceptions} open exception${openExceptions === 1 ? "" : "s"}`}>
          SLA breaches, blocked tasks, or overdue revisions need PMO action.
        </ContextBanner>
      )}

      <SectionCard
        title="Milestone progress"
        description={milestoneNames || "No milestones yet"}
      >
        <div className="px-5 sm:px-6 py-5">
          <MilestoneStepper milestones={project.milestones} />
        </div>
      </SectionCard>

      <SectionCard title="Project details" description="Metadata for this delivery project">
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
      </SectionCard>

      <section className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        <div className="px-5 sm:px-6 pt-4 pb-0 border-b border-white/55">
          <nav aria-label="Project sections" className="flex flex-wrap gap-x-1 -mb-px">
            {TABS.map((t) => {
              const active = tab === t.id;
              const count = tabCounts[t.id];
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTab(t.id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 px-3 py-2.5",
                    "font-body text-[13px] font-semibold whitespace-nowrap transition-colors duration-fast",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-t-sm",
                    active ? "text-foreground" : "text-text-secondary hover:text-foreground",
                  )}
                >
                  {t.label}
                  {count != null && count > 0 && (
                    <span
                      className={cn(
                        "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full font-mono text-[10px] font-bold tabular-nums",
                        active ? "bg-white/70 text-foreground" : "bg-white/55 text-text-tertiary",
                        t.id === "exceptions" && count > 0 && !active && "text-warning-text",
                      )}
                    >
                      {count}
                    </span>
                  )}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-x-2 bottom-0 h-0.5 rounded-full"
                      style={{ backgroundImage: AURORA_ACCENT }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div role="tabpanel" className="px-5 sm:px-6 py-4">
          {tab === "activity" && <ActivityPanel project={project} />}
          {tab === "delivery" && <DeliveryPanel project={project} onProjectUpdate={onProjectUpdate} />}
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

function ContextBanner({
  tone,
  title,
  children,
}: {
  tone: "error" | "brand";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border px-4 py-3 backdrop-blur"
      style={{
        background: tone === "error" ? TONE.error.soft : TONE.info.soft,
        borderColor: tone === "error" ? TONE.error.border : TONE.info.border,
      }}
    >
      <p
        className={cn(
          "font-body text-[13px] font-semibold",
          tone === "error" ? "text-error-text" : "text-foreground",
        )}
      >
        {title}
      </p>
      <p className="mt-1 font-body text-[12.5px] text-text-secondary leading-relaxed">{children}</p>
    </div>
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
          state === "waiting" && "border-white/55 bg-white/45",
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
          <ul className="divide-y divide-white/60 border-t border-white/55">
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
          <ul className="divide-y divide-white/60 border-t border-white/55">
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

function DeliveryPanel({
  project,
  onProjectUpdate,
}: {
  project: ProjectDetail;
  onProjectUpdate?: (p: ProjectDetail) => void;
}) {
  const [assignTask, setAssignTask] = React.useState<ProjectTaskRow | null>(null);
  const gated = project.milestones.some((m) => m.paymentStatus != null);

  return (
    <>
      <div className="space-y-6 -mx-5 sm:-mx-6">
        {project.milestones.length === 0 && project.tasks.length === 0 ? (
          <EmptyLine>No milestones or tasks on this project yet.</EmptyLine>
        ) : (
          project.milestones.map((m, i) => {
            const tasks = tasksForMilestone(project, m, i);
            return (
              <div key={m.id}>
                <div className="px-5 sm:px-6 py-2.5 border-b border-white/55">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-body text-[11px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
                      {m.name}
                    </p>
                    <Chip tone={MILESTONE_TONE[m.status]}>{m.status.replace(/_/g, " ")}</Chip>
                    <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums ml-auto">
                      {Math.round(m.progress * 100)}%
                      {m.amountMinor != null && ` · ${fmtINR(m.amountMinor)}`}
                    </span>
                  </div>
                  {m.note && (
                    <p className="mt-1 font-body text-[12px] text-text-secondary">{m.note}</p>
                  )}
                  {m.paymentStatus != null && (
                    <MilestonePaymentRow
                      projectId={project.id}
                      milestone={m}
                      onProjectUpdate={onProjectUpdate}
                    />
                  )}
                </div>
                {tasks.length === 0 ? (
                  <p className="px-5 sm:px-6 py-3 font-body text-[12px] text-text-tertiary italic">
                    No tasks in this milestone.
                  </p>
                ) : (
                  <ul className="divide-y divide-white/60">
                    {tasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        project={project}
                        task={task}
                        onAssign={() => setAssignTask(task)}
                      />
                    ))}
                  </ul>
                )}
              </div>
            );
          })
        )}

        {gated && (
          <p className="px-5 sm:px-6 font-body text-[11px] text-text-tertiary">
            Delivery gates: contributor submits → Mentor reviews (Glimmora) → Enterprise reviewer
            accepts the milestone → pay. Paying emits contributor payouts in Finance → Payouts.
          </p>
        )}
      </div>

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
  const stateLabel = task.state.replace(/_/g, " ");

  return (
    <li className="flex items-center justify-between gap-3 px-5 sm:px-6 py-2.5 min-h-[44px] hover:bg-white/40 transition-colors duration-fast">
      <Link
        href={`/enterprise/projects/${project.id}/tasks/${task.id}`}
        className="min-w-0 flex-1 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm"
      >
        <span className="font-body text-[13px] font-medium text-foreground truncate block group-hover:text-[var(--c-violet-500)] transition-colors duration-fast">
          {task.title}
        </span>
        <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums">{task.id}</span>
      </Link>
      <span
        className={cn(
          "font-body text-[11px] shrink-0 text-right max-w-[45%] truncate",
          task.state === "blocked"
            ? "text-error-text font-medium"
            : task.state === "submitted" || task.state === "reviewed"
              ? "text-warning-text"
              : "text-text-tertiary",
        )}
      >
        {task.assignee === "Unassigned" || !task.assignee ? "Unassigned" : task.assignee} ·{" "}
        {stateLabel} · {task.effortHours}h
      </span>
      {assignable ? (
        <button
          type="button"
          onClick={onAssign}
          style={primaryStyle}
          className={cn(primaryBtnClass, "h-7 px-2.5 text-[11.5px]")}
        >
          Assign
        </button>
      ) : null}
    </li>
  );
}

function MilestonePaymentRow({
  projectId,
  milestone,
  onProjectUpdate,
}: {
  projectId: string;
  milestone: ProjectDetail["milestones"][number];
  onProjectUpdate?: (p: ProjectDetail) => void;
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

  const accept = async () => {
    setBusy("accept");
    setErr(null);
    try {
      const res = await fetchInternal(
        `/api/enterprise/projects/${encodeURIComponent(projectId)}/milestones/${encodeURIComponent(milestone.id)}/accept`,
        { method: "POST", cache: "no-store" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string; detail?: string };
        setErr(body.error ?? body.detail ?? "Failed to accept milestone");
        return;
      }
      const updated = await res.json() as ProjectDetail;
      onProjectUpdate?.(updated);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  const pay = async (): Promise<boolean> => {
    setBusy("pay");
    setErr(null);
    try {
      const res = await fetchInternal(
        `/api/enterprise/projects/${encodeURIComponent(projectId)}/milestones/${encodeURIComponent(milestone.id)}/pay`,
        { method: "POST", cache: "no-store" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string; detail?: string };
        setErr(body.error ?? body.detail ?? "Failed to pay milestone");
        return false;
      }
      const updated = await res.json() as ProjectDetail;
      onProjectUpdate?.(updated);
      return true;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
      return false;
    } finally {
      setBusy(null);
    }
  };

  const confirmAndPay = async () => {
    const ok = await pay();
    if (ok) setConfirmOpen(false);
  };

  const badge: { label: string; tone: Tone } =
    status === "paid"
      ? { label: "Paid", tone: "success" }
      : status === "payable"
        ? { label: "Reviewer accepted · payable", tone: "info" }
        : { label: "Awaiting reviewer acceptance", tone: "neutral" };

  const lineCount = milestone.lineItems?.length ?? 0;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-white/55 bg-white/40 px-2.5 py-2 backdrop-blur">
      <Chip tone={badge.tone}>{badge.label}</Chip>
      {lineCount > 0 && (
        <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums">
          {lineCount} contributor {lineCount === 1 ? "payout" : "payouts"}
        </span>
      )}
      <div className="ml-auto flex items-center gap-1.5">
        {err && (
          <span role="alert" className="font-body text-[11px] text-error-text">
            {err}
          </span>
        )}
        {status === "locked" && (
          <button
            type="button"
            onClick={() => void accept()}
            disabled={busy !== null}
            className={cn(ghostBtnClass, "h-7 px-2.5 text-[12px]")}
          >
            {busy === "accept" ? "Accepting…" : "Accept (enterprise reviewer)"}
          </button>
        )}
        {status === "payable" && (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={busy !== null}
            style={primaryStyle}
            className={cn(primaryBtnClass, "h-7 px-2.5 text-[12px]")}
          >
            {busy === "pay" ? "Paying…" : "Pay milestone"}
          </button>
        )}
        {status === "paid" && (
          <span className="inline-flex items-center gap-1 font-body text-[11.5px] text-success-text">
            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            Paid{milestone.paidAt ? ` · ${timeAgo(milestone.paidAt)}` : ""}
          </span>
        )}
      </div>
      {status === "payable" && (
        <Dialog open={confirmOpen} onOpenChange={(open) => (busy ? null : setConfirmOpen(open))}>
          <DialogContent className={cn("max-w-md", GLASS_MODAL_CLASS)}>
            <DialogHeader>
              <DialogTitle className="font-display">Confirm milestone payment</DialogTitle>
              <DialogDescription>
                Review payment details before release.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-xl border border-white/55 bg-white/45 p-3 space-y-2 backdrop-blur">
              <p className="font-body text-[12px] font-semibold text-foreground">{milestone.name}</p>
              <div className="flex items-center justify-between font-body text-[12px] text-text-secondary">
                <span>Amount (excl. GST)</span>
                <span className="font-mono text-[12px] tabular-nums">{fmtINR(amountExcludingGstMinor)}</span>
              </div>
              <div className="flex items-center justify-between font-body text-[12px] text-text-secondary">
                <span>GST ({Math.round(GST_RATE * 100)}%)</span>
                <span className="font-mono text-[12px] tabular-nums">{fmtINR(gstMinor)}</span>
              </div>
              <div className="border-t border-white/55 pt-2 flex items-center justify-between">
                <span className="font-body text-[12px] font-semibold text-foreground">Total payable</span>
                <span className="font-mono text-[13px] font-semibold tabular-nums text-foreground">
                  {fmtINR(totalPayableMinor)}
                </span>
              </div>
            </div>

            <p className="font-body text-[11px] text-text-tertiary">
              Payouts for assigned contributors are emitted after this payment succeeds.
            </p>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={busy !== null}
                className={cn(ghostBtnClass, "h-8 px-3 text-[12px]")}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmAndPay()}
                disabled={busy !== null}
                style={primaryStyle}
                className={cn(primaryBtnClass, "h-8 px-3 text-[12px]")}
              >
                {busy === "pay" ? "Paying…" : `Confirm & pay ${fmtINR(totalPayableMinor)}`}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
          <ul className="divide-y divide-white/60 border-t border-white/55">
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
          <ul className="divide-y divide-white/60 border-t border-white/55">
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
      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/55 bg-white/55 text-text-secondary font-body text-[11px] font-semibold shrink-0 backdrop-blur"
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
          className={cn(GLASS_CARD, "fixed bottom-6 right-6 z-50 max-w-md px-4 py-3 flex items-start gap-2.5")}
          style={GLASS_SHADOW}
        >
          <CheckCircle2 className="h-4 w-4 text-success-text mt-0.5 shrink-0" strokeWidth={2.5} aria-hidden />
          <p className="font-body text-[12.5px] text-foreground">{toast}</p>
        </div>
      )}

      <SectionBlock title="Open" count={project.openExceptions.length}>
        {project.openExceptions.length === 0 ? (
          <EmptyLine>No open exceptions.</EmptyLine>
        ) : (
          <ul className="divide-y divide-white/60 border-t border-white/55">
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
          <ul className="divide-y divide-white/60 border-t border-white/55">
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
      className="inline-flex items-center gap-1 h-6 px-2 rounded-lg bg-white/55 border border-white/55 font-body text-[11.5px] font-semibold text-foreground hover:bg-white/75 transition-colors duration-fast backdrop-blur"
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
          <ul className="divide-y divide-white/60 border-t border-white/55">
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
          <ul className="divide-y divide-white/60 border-t border-white/55">
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
        <ul className="divide-y divide-white/60 border-t border-white/55">
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
