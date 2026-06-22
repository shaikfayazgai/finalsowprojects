"use client";

/**
 * Digital twin detail — activity, reliability, skills reinforcement, insights.
 */

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  Info,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { DashboardSection } from "@/components/meridian/dashboard";
import { StatusChip } from "@/components/meridian";
import { useActivePersona } from "@/lib/hooks/use-active-persona";
import { useContributorDigitalTwinDetail } from "@/lib/hooks/use-contributor-digital-twin";
import { PERSONAS } from "@/mocks/contributor/personas";
import { cn } from "@/lib/utils/cn";
import { DigitalTwinSkeleton } from "./digital-twin-skeleton";
import {
  filterActivityByPeriod,
  fmtTwinUpdated,
  maxTasksInPeriod,
  reliabilityBand,
  reliabilityChip,
  reliabilityLabel,
  trendChipStatus,
  trendLabel,
  TWIN_PERIOD_TABS,
  type TwinHistoryPeriod,
} from "../lib/digital-twin-ui-utils";

export function DigitalTwinWorkspace() {
  const { persona, isLoading: personaLoading } = useActivePersona();
  const personaLabel = PERSONAS.find((p) => p.key === persona)?.shortLabel ?? persona;
  const [period, setPeriod] = React.useState<TwinHistoryPeriod>("6m");

  const { data, isLoading, error, refetch, isFetching } = useContributorDigitalTwinDetail();
  const loading = personaLoading || (isLoading && !data);

  if (loading) return <DigitalTwinSkeleton />;

  const twin = data?.twin ?? null;
  const skills = data?.skills ?? [];
  const skillTotal = data?.skillTotal ?? 0;
  const availability = data?.availability;
  const band = twin ? reliabilityBand(twin) : null;
  const activity = twin ? filterActivityByPeriod(twin.monthlyActivity, period) : [];
  const activityMax = maxTasksInPeriod(activity);

  return (
    <div className="space-y-4 pb-12">
      {error ? (
        <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 flex flex-wrap items-center gap-3">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">
            {(error as Error).message}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-surface border border-stroke font-body text-[12px] font-semibold text-foreground hover:bg-surface-hover"
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Retry
          </button>
        </div>
      ) : null}

      {!twin ? (
        <div className="space-y-4">
          <section className="rounded-xl border border-stroke-subtle bg-surface px-5 py-6">
            <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
              Delivery metrics not available yet
            </h2>
            <p className="mt-2 font-body text-[12.5px] text-text-secondary leading-relaxed max-w-2xl">
              Reliability bands, acceptance rates, and activity charts are derived from accepted
              work — not collected during onboarding. They will appear after your first completed
              deliveries.
            </p>
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
            <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
              <div className="px-5 py-4 border-b border-stroke-subtle">
                <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                  Declared skills
                </h2>
                <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                  {skillTotal} from onboarding — reinforced when you complete related tasks
                </p>
              </div>
              {skills.length === 0 ? (
                <p className="px-5 py-8 font-body text-[12.5px] text-text-tertiary text-center italic">
                  No skills declared yet.
                </p>
              ) : (
                <ul className="divide-y divide-stroke-subtle">
                  {skills.map((skill) => (
                    <li key={skill.id}>
                      <Link
                        href={`/contributor/profile/skills/${skill.id}`}
                        className="flex items-center justify-between gap-3 px-5 min-h-[56px] py-3.5 hover:bg-bg-subtle/60 transition-colors duration-fast"
                      >
                        <span className="font-body text-[13px] font-semibold text-foreground">
                          {skill.name}
                        </span>
                        <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums">
                          {skill.level}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <aside className="space-y-4">
              {availability && availability.hoursPerWeek > 0 ? (
                <DashboardSection
                  title="Availability"
                  description="From onboarding — update in profile edit"
                >
                  <dl className="space-y-3">
                    <RailItem label="Weekly capacity">{`${availability.hoursPerWeek}h`}</RailItem>
                    <RailItem label="Timezone">{availability.timezone}</RailItem>
                  </dl>
                </DashboardSection>
              ) : null}

              <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/50 px-4 py-3 flex items-start gap-2.5">
                <Info className="h-3.5 w-3.5 text-text-tertiary shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
                <p className="font-body text-[11.5px] text-text-secondary leading-relaxed">
                  This summary updates as you complete tasks. It is not shared publicly and is not
                  used to rank you against peers.
                </p>
              </div>

              <p className="text-right font-body text-[11px] text-text-tertiary">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-bg-subtle border border-stroke-subtle">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
                  Persona: {personaLabel}
                </span>
              </p>
            </aside>
          </div>
        </div>
      ) : (
        <>
          {/* Reliability hero */}
          <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-br from-brand-subtle/40 via-surface to-bg-subtle border-b border-stroke-subtle flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
                  Reliability band
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {band ? (
                    <StatusChip status={reliabilityChip(band)} size="sm">
                      {reliabilityLabel(band)}
                    </StatusChip>
                  ) : null}
                  <StatusChip status={trendChipStatus(twin.performanceTrend)} size="sm">
                    {trendLabel(twin.performanceTrend)}
                  </StatusChip>
                </div>
                <p className="mt-2 font-body text-[12.5px] text-text-secondary max-w-xl leading-relaxed">
                  Based on on-time delivery and first-try acceptance over your recent work — not a
                  ranking against other contributors.
                </p>
              </div>
              <p className="font-body text-[11px] text-text-tertiary shrink-0">
                Updated {fmtTwinUpdated(twin.updatedAt)}
              </p>
            </div>
          </section>

          <DashboardSection
            title="30-day snapshot"
            description="Recent activity used for task matching"
          >
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
              <SummaryStat
                label="Completed"
                value={String(twin.tasksCompleted30d)}
                highlight={twin.tasksCompleted30d > 0}
              />
              <SummaryStat
                label="Acceptance rate"
                value={`${twin.acceptanceRatePct}%`}
                highlight={twin.acceptanceRatePct >= 85}
              />
              <SummaryStat
                label="On-time"
                value={`${twin.onTimePct}%`}
                highlight={twin.onTimePct >= 85}
              />
              <SummaryStat
                label="Active streak"
                value={`${twin.streakDays}d`}
                hint={`Best ${twin.longestStreak}d`}
                highlight={twin.streakDays >= 5}
              />
            </dl>
          </DashboardSection>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
            <div className="space-y-4 min-w-0">
              {/* Activity chart */}
              <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
                <div className="px-5 pt-4 pb-0 border-b border-stroke-subtle">
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
                    <div>
                      <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                        Delivery activity
                      </h2>
                      <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                        Tasks completed per month
                      </p>
                    </div>
                  </div>
                  <nav aria-label="Activity period" className="flex flex-wrap gap-x-1 -mb-px">
                    {TWIN_PERIOD_TABS.map((tab) => {
                      const active = period === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setPeriod(tab.id)}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "relative inline-flex items-center px-3 py-2.5",
                            "font-body text-[13px] font-medium whitespace-nowrap",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-t-sm",
                            active ? "text-foreground" : "text-text-secondary hover:text-foreground",
                          )}
                        >
                          {tab.label}
                          {active ? (
                            <span
                              aria-hidden
                              className="absolute inset-x-0 -bottom-px h-0.5 bg-brand rounded-full"
                            />
                          ) : null}
                        </button>
                      );
                    })}
                  </nav>
                </div>
                <div className="p-5 space-y-3">
                  {activity.length === 0 ? (
                    <p className="font-body text-[12.5px] text-text-tertiary text-center py-6 italic">
                      No activity recorded for this period.
                    </p>
                  ) : (
                    activity.map((row) => (
                      <ActivityBar
                        key={row.month}
                        label={row.month}
                        count={row.tasksCompleted}
                        max={activityMax}
                        hours={row.hoursLogged}
                      />
                    ))
                  )}
                </div>
              </section>

              {/* Reliability breakdown */}
              <DashboardSection
                title="Reliability signals"
                description={`${twin.totalSubmissions} total submissions · ${twin.reworkRatePct}% rework rate`}
              >
                <div className="space-y-3">
                  <MetricBar label="First-try acceptance" value={twin.firstTryAcceptPct} tone="brand" />
                  <MetricBar label="On-time delivery" value={twin.onTimePct} tone="brand" />
                  <MetricBar
                    label="Avg review score"
                    value={Math.round((twin.averageReviewScore / 5) * 100)}
                    tone="info"
                    suffix={`${twin.averageReviewScore.toFixed(1)}/5`}
                  />
                </div>
              </DashboardSection>

              {/* Top skills */}
              <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
                <div className="px-5 py-4 border-b border-stroke-subtle flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                      Reinforcing skills
                    </h2>
                    <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                      Most observed on accepted deliveries
                    </p>
                  </div>
                  <Link
                    href="/contributor/profile/skills"
                    className="font-body text-[11.5px] font-semibold text-text-link hover:underline inline-flex items-center gap-0.5"
                  >
                    Skill registry
                    <ChevronRight className="h-3 w-3" strokeWidth={2} aria-hidden />
                  </Link>
                </div>
                {twin.topSkills.length === 0 ? (
                  <p className="px-5 py-8 font-body text-[12.5px] text-text-tertiary text-center italic">
                    Complete tasks to build skill reinforcement data.
                  </p>
                ) : (
                  <ul className="divide-y divide-stroke-subtle">
                    {twin.topSkills.map((row) => (
                      <li
                        key={row.skill}
                        className="flex items-center justify-between gap-3 px-5 min-h-[56px] py-3.5 hover:bg-bg-subtle/60 transition-colors duration-fast"
                      >
                        <span className="font-body text-[13px] font-semibold text-foreground">
                          {row.skill}
                        </span>
                        <span className="flex items-center gap-3 shrink-0">
                          <span className="font-body text-[11.5px] text-text-secondary tabular-nums">
                            {row.tasksCompleted} tasks
                          </span>
                          <StatusChip status="neutral" size="sm">
                            {row.avgScore.toFixed(1)} avg
                          </StatusChip>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* AI insights */}
              {twin.aiInsights.length > 0 ? (
                <section className="rounded-xl border border-ai-border bg-ai-surface/30 overflow-hidden">
                  <div className="px-5 py-4 border-b border-ai-border/60 flex items-start gap-2.5">
                    <Sparkles
                      className="h-4 w-4 text-ai-text shrink-0 mt-0.5"
                      strokeWidth={2}
                      aria-hidden
                    />
                    <div>
                      <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                        Pattern observations
                      </h2>
                      <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                        Assistive notes from your delivery history — not automatic decisions
                      </p>
                    </div>
                  </div>
                  <ul className="px-5 py-4 space-y-3">
                    {twin.aiInsights.map((insight) => (
                      <li
                        key={insight}
                        className="font-body text-[12.5px] text-text-secondary leading-relaxed pl-3 border-l-2 border-ai-border"
                      >
                        {insight}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>

            <aside className="space-y-4 xl:sticky xl:top-[calc(var(--shell-topbar-height,52px)+1rem)] xl:self-start xl:max-h-[calc(100dvh-var(--shell-topbar-height,52px)-2rem)] xl:overflow-y-auto xl:overscroll-y-contain">
              {/* 30d activity rail */}
              <DashboardSection title="Last 30 days" description="Task flow">
                <dl className="space-y-3">
                  <RailItem label="In flight">{String(twin.tasksInFlight)}</RailItem>
                  <RailItem label="Declined">{String(twin.tasksDeclined30d)}</RailItem>
                  <RailItem label="Withdrawals">{String(twin.withdrawals)}</RailItem>
                  <RailItem label="Hours logged">{`${twin.totalHoursLogged}h total`}</RailItem>
                </dl>
              </DashboardSection>

              {/* Skills */}
              <DashboardSection
                title="Skills"
                description="Declared vs reinforced"
                actions={
                  <Link
                    href="/contributor/profile/skills"
                    className="font-body text-[11.5px] font-semibold text-text-link hover:underline"
                  >
                    Manage
                  </Link>
                }
              >
                <dl className="space-y-3">
                  <RailItem label="Declared">{String(skillTotal)}</RailItem>
                  <RailItem label="Reinforcing">{String(twin.tasksReinforcing)}</RailItem>
                </dl>
                <Link
                  href="/contributor/profile/evidence"
                  className="mt-4 pt-4 border-t border-stroke-subtle block font-body text-[12.5px] text-brand hover:underline"
                >
                  Link evidence to skills →
                </Link>
              </DashboardSection>

              {/* Availability */}
              <DashboardSection title="Availability" description="Self-declared window">
                <dl className="space-y-3">
                  <RailItem label="Days">{twin.weekDays}</RailItem>
                  <RailItem label="Hours">{twin.weekHoursRange}</RailItem>
                  <RailItem label="Weekly capacity">{`${twin.hoursPerWeek}h`}</RailItem>
                </dl>
                <p className="mt-4 pt-4 border-t border-stroke-subtle font-body text-[11px] text-text-tertiary leading-relaxed flex items-start gap-1.5">
                  <Calendar className="h-3 w-3 shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
                  Update availability in onboarding settings when your schedule changes.
                </p>
              </DashboardSection>

              <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/50 px-4 py-3 flex items-start gap-2.5">
                <Info className="h-3.5 w-3.5 text-text-tertiary shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
                <p className="font-body text-[11.5px] text-text-secondary leading-relaxed">
                  This summary updates as you complete tasks. It is not shared publicly and is not
                  used to rank you against peers.
                </p>
              </div>

              <p className="text-right font-body text-[11px] text-text-tertiary">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-bg-subtle border border-stroke-subtle">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
                  Persona: {personaLabel}
                </span>
              </p>
            </aside>
          </div>
        </>
      )}

      {isFetching && !loading ? (
        <p className="sr-only" aria-live="polite">
          Refreshing digital twin…
        </p>
      ) : null}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[11px] font-medium text-text-tertiary uppercase tracking-wide">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[22px] font-semibold tabular-nums tracking-[-0.02em]",
          highlight ? "text-foreground" : "text-text-secondary",
        )}
      >
        {value}
      </dd>
      {hint ? (
        <p className="mt-0.5 font-body text-[11px] text-text-tertiary">{hint}</p>
      ) : null}
    </div>
  );
}

function RailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="font-body text-[12px] text-text-secondary">{label}</dt>
      <dd className="font-body text-[12.5px] font-semibold text-foreground tabular-nums">
        {children}
      </dd>
    </div>
  );
}

function ActivityBar({
  label,
  count,
  max,
  hours,
}: {
  label: string;
  count: number;
  max: number;
  hours: number;
}) {
  const pct = max === 0 ? 0 : (count / max) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="font-body text-[12.5px] text-foreground w-10 shrink-0">{label}</span>
      <span className="font-mono text-[11.5px] tabular-nums text-text-tertiary w-5 shrink-0">
        {count}
      </span>
      <div className="flex-1 h-2 rounded-full bg-bg-subtle overflow-hidden">
        <div className="h-full rounded-full bg-brand transition-all duration-fast" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-body text-[11px] text-text-tertiary tabular-nums w-12 text-right shrink-0">
        {hours}h
      </span>
    </div>
  );
}

function MetricBar({
  label,
  value,
  tone,
  suffix,
}: {
  label: string;
  value: number;
  tone: "brand" | "info";
  suffix?: string;
}) {
  const barCls = tone === "brand" ? "bg-brand" : "bg-info";
  return (
    <div className="flex items-center gap-3">
      <span className="font-body text-[12.5px] text-foreground w-36 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-bg-subtle overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-fast", barCls)}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
      <span className="font-mono text-[11.5px] tabular-nums text-text-secondary w-14 text-right shrink-0">
        {suffix ?? `${value}%`}
      </span>
    </div>
  );
}
