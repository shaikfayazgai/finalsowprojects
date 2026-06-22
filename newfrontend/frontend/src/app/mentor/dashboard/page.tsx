"use client";

/**
 * Mentor dashboard — Meridian V2 (enterprise / admin aligned).
 */

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  Clock,
  AlertTriangle,
  Calendar,
  AlertCircle,
  ClipboardList,
  TrendingUp,
} from "lucide-react";
import { StatusChip } from "@/components/meridian";
import { DashboardSection, KeyMetricCard } from "@/components/meridian/dashboard";
import { SplitPanel } from "@/components/meridian/layout";
import { useActiveMentor } from "@/lib/hooks/use-active-mentor";
import { fetchMentorDashboard, MentorApiError, type DashboardResponse } from "@/lib/api/mentor-mock";
import { MentorDashboardSkeleton } from "@/app/mentor/_components/mentor-skeletons";
import {
  MentorPage,
  MentorPageHeader,
  MentorBanner,
  MentorListRow,
  mentorPrimaryBtn,
  mentorGhostLink,
} from "@/app/mentor/_components/mentor-ui";
import { cn } from "@/lib/utils/cn";

function fmtRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

function fmtSlaRemaining(iso: string): { text: string; tone: "danger" | "warn" | "ok" } {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) return { text: "Breached", tone: "danger" };
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const text = h > 0 ? `${h}h ${m}m remaining` : `${m}m remaining`;
  if (ms < 4 * 3_600_000) return { text, tone: "warn" };
  return { text, tone: "ok" };
}

function fmtTodayTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
}

function fmtDay(): string {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

function greeting(firstName: string): string {
  const h = new Date().getHours();
  if (h < 12) return `Good morning, ${firstName}`;
  if (h < 17) return `Good afternoon, ${firstName}`;
  return `Good evening, ${firstName}`;
}

export default function MentorDashboardPage() {
  const { profile, isSeniorOrLead, role } = useActiveMentor();
  const [data, setData] = React.useState<DashboardResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const c = new AbortController();
    fetchMentorDashboard(c.signal)
      .then(setData)
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError") return;
        setError(err instanceof MentorApiError ? err.message : "Could not load dashboard.");
      });
    return () => c.abort();
  }, []);

  const isLead = role === "mentor.lead";

  if (error) {
    return (
      <MentorPage>
        <MentorPageHeader title="Dashboard" />
        <MentorBanner tone="error" icon={<AlertCircle className="h-4 w-4" strokeWidth={2} />}>
          {error}
        </MentorBanner>
      </MentorPage>
    );
  }

  if (!data) return <MentorDashboardSkeleton />;

  const { pendingCount, slaRiskCount, hero, todaySessions, openEscalations, teamLoad, queueGlance } = data;
  const sla = hero ? fmtSlaRemaining(hero.dueAt) : null;

  return (
    <MentorPage className="space-y-6">
      <MentorPageHeader
        title={greeting(profile.firstName)}
        subtitle={fmtDay()}
        meta={
          <>
            <span className="font-medium text-foreground tabular-nums">{pendingCount}</span> reviews pending
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            <span className={cn("font-medium tabular-nums", slaRiskCount > 0 ? "text-warning-text" : "text-foreground")}>
              {slaRiskCount}
            </span>{" "}
            SLA at risk
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KeyMetricCard icon={ClipboardList} tone="blue" label="Pending reviews" value={String(queueGlance.pending)} />
        <KeyMetricCard
          icon={Clock}
          tone={queueGlance.slaRisk > 0 ? "amber" : "green"}
          label="SLA at risk"
          value={String(queueGlance.slaRisk)}
        />
        <KeyMetricCard icon={TrendingUp} tone="violet" label="Completed (7d)" value={String(queueGlance.done7d)} />
        <KeyMetricCard icon={Clock} tone="cyan" label="Avg review time" value={`${queueGlance.avgTimeMin}m`} />
      </div>

      <SplitPanel
        aside={
          <div className="space-y-5">
            <DashboardSection title="Queue glance" viewAllHref="/mentor/queue" viewAllLabel="Open queue">
              <dl className="space-y-3">
                <GlanceRow label="Pending" value={String(queueGlance.pending)} />
                <GlanceRow label="SLA risk" value={String(queueGlance.slaRisk)} warn={queueGlance.slaRisk > 0} />
                <GlanceRow label="Done (7d)" value={String(queueGlance.done7d)} />
                <GlanceRow label="Avg time" value={`${queueGlance.avgTimeMin} min`} />
              </dl>
            </DashboardSection>

            <DashboardSection title="AI signals">
              <ul className="space-y-2.5 font-body text-[12.5px] text-foreground">
                <li className="flex items-start gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-brand-subtle-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
                  2 reviews waiting for you are on contributors you&apos;ve coached.
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-brand-subtle-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
                  Your accept rate (78% last 30d) is steady.
                </li>
              </ul>
            </DashboardSection>
          </div>
        }
      >
        <div className="space-y-5">
            {hero ? (
              <DashboardSection eyebrow="Priority" title="Next review">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <h3 className="font-body text-[17px] font-semibold text-foreground tracking-[-0.01em] leading-tight">
                      {hero.taskTitle} · Round {hero.round}
                    </h3>
                    <p className="mt-1.5 font-body text-[12.5px] text-text-secondary">
                      Submitted by {hero.contributorName} {fmtRelative(hero.submittedAt)}
                      <span aria-hidden className="opacity-50 mx-1.5">·</span>
                      {sla && (
                        <StatusChip
                          status={sla.tone === "danger" ? "error" : sla.tone === "warn" ? "warning" : "success"}
                          size="sm"
                        >
                          SLA: {sla.text}
                        </StatusChip>
                      )}
                    </p>
                    <p className="mt-1 font-body text-[12px] text-text-tertiary">
                      {hero.project}
                      <span aria-hidden className="opacity-50 mx-1.5">·</span>
                      {hero.stage === "two_stage" ? "Two-stage · routes to client after you" : "Single-stage"}
                    </p>
                    <p className="mt-3 font-body text-[12px] text-text-secondary">
                      <span className="font-semibold text-foreground">Why first?</span> SLA closest to breach; high readiness
                    </p>
                  </div>
                  <Link href={`/mentor/queue/${hero.id}`} className={mentorPrimaryBtn}>
                    Open review →
                  </Link>
                </div>
              </DashboardSection>
            ) : pendingCount > 0 ? (
              <DashboardSection title="Reviews waiting">
                <p className="font-body text-[13.5px] font-semibold text-foreground">
                  {pendingCount} review{pendingCount > 1 ? "s" : ""} in your queue
                </p>
                <p className="mt-1 font-body text-[12.5px] text-text-tertiary">
                  <Link href="/mentor/queue" className="underline">Open the queue</Link> to pick up your next review.
                </p>
              </DashboardSection>
            ) : (
              <DashboardSection title="Queue clear">
                <p className="font-body text-[13.5px] font-semibold text-foreground">You&apos;re all caught up</p>
                <p className="mt-1 font-body text-[12.5px] text-text-tertiary">
                  New reviews appear here when contributors submit.
                </p>
              </DashboardSection>
            )}

            {isSeniorOrLead && openEscalations.length > 0 && (
              <DashboardSection
                title={`Escalations awaiting you (${openEscalations.length})`}
                viewAllHref="/mentor/escalation"
                viewAllLabel="Open escalations"
              >
                <ul className="divide-y divide-stroke-subtle -mx-5 -mb-5">
                  {openEscalations.map((e) => (
                    <MentorListRow
                      key={e.id}
                      href={`/mentor/escalation/${e.id}`}
                      title={`${e.taskTitle} · ${e.contributorName}`}
                      meta={e.type.replace("_", " ")}
                      trailing={
                        <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums">
                          {fmtRelative(e.openedAt)}
                        </span>
                      }
                      leading={
                        <AlertTriangle className="h-4 w-4 text-warning-text shrink-0" strokeWidth={2} aria-hidden />
                      }
                    />
                  ))}
                </ul>
              </DashboardSection>
            )}

            <DashboardSection
              title={`Today's mentorship sessions (${todaySessions.length})`}
              viewAllHref="/mentor/mentorship"
              viewAllLabel="All sessions"
            >
              {todaySessions.length === 0 ? (
                <p className="font-body text-[12.5px] text-text-tertiary italic">No sessions today.</p>
              ) : (
                <ul className="divide-y divide-stroke-subtle -mx-5 -mb-5">
                  {todaySessions.map((s) => (
                    <MentorListRow
                      key={s.id}
                      href={`/mentor/mentorship/${s.id}`}
                      title={s.contributorName}
                      meta={`${fmtTodayTime(s.scheduledAt)} · ${s.durationMin} min · ${s.focus}`}
                      leading={<Calendar className="h-4 w-4 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />}
                    />
                  ))}
                </ul>
              )}
            </DashboardSection>

            {isLead && (
              <DashboardSection title={`Team load · ${teamLoad.poolName}`}>
                <ul className="space-y-3">
                  {teamLoad.members.map((m) => (
                    <li key={m.id} className="flex items-center gap-3">
                      <span className="font-body text-[12.5px] font-medium text-foreground w-32 shrink-0 truncate">
                        {m.displayName}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-bg-subtle overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-fast",
                            m.atLimit ? "bg-warning-text" : m.loadPct >= 70 ? "bg-brand" : "bg-success-text",
                          )}
                          style={{ width: `${m.loadPct}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-text-tertiary tabular-nums w-12 text-right shrink-0">
                        {m.loadPct}%
                      </span>
                      <span className="font-body text-[11.5px] text-text-tertiary shrink-0 w-20 text-right">
                        {m.pendingReviews} pending
                      </span>
                      {m.atLimit && (
                        <AlertTriangle className="h-3.5 w-3.5 text-warning-text shrink-0" strokeWidth={2} aria-hidden />
                      )}
                    </li>
                  ))}
                </ul>
                <button type="button" className={cn(mentorGhostLink, "mt-4 inline-block")}>
                  Reassign across team →
                </button>
              </DashboardSection>
            )}
        </div>
      </SplitPanel>
    </MentorPage>
  );
}

function GlanceRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="font-body text-[12px] text-text-secondary">{label}</dt>
      <dd className={cn("font-display text-[18px] font-semibold tabular-nums", warn ? "text-warning-text" : "text-foreground")}>
        {value}
      </dd>
    </div>
  );
}
