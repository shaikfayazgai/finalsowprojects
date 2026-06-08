"use client";

/**
 * Mentor dashboard — REAL per-mentor data only (scoped to the signed-in mentor's
 * account id via /api/mentor/dashboard). No mock/demo content. A new mentor sees
 * an empty workspace until real submissions are routed to them.
 */

import * as React from "react";
import Link from "next/link";
import { Clock, AlertCircle, ClipboardList, TrendingUp, Users, FileText } from "lucide-react";
import { StatusChip } from "@/components/meridian";
import { DashboardSection, KeyMetricCard } from "@/components/meridian/dashboard";
import { SplitPanel } from "@/components/meridian/layout";
import { useActiveMentor } from "@/lib/hooks/use-active-mentor";
import {
  fetchMentorDashboardReal,
  fetchMentorAssignedSows,
  type MentorDashboardReal,
  type MentorAssignedSow,
} from "@/lib/api/mentor";
import { MentorDashboardSkeleton } from "@/app/mentor/_components/mentor-skeletons";
import {
  MentorPage,
  MentorPageHeader,
  MentorBanner,
  MentorListRow,
  mentorPrimaryBtn,
} from "@/app/mentor/_components/mentor-ui";
import { cn } from "@/lib/utils/cn";

function fmtRelative(iso?: string | null): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
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
  const { profile } = useActiveMentor();
  const [data, setData] = React.useState<MentorDashboardReal | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [assignedSows, setAssignedSows] = React.useState<MentorAssignedSow[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    fetchMentorDashboardReal()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load dashboard.");
      });
    fetchMentorAssignedSows()
      .then((s) => { if (!cancelled) setAssignedSows(s); })
      .catch(() => { /* supplementary */ });
    return () => { cancelled = true; };
  }, []);

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

  const { stats, recent_queue } = data;
  const hero = recent_queue[0] ?? null;

  return (
    <MentorPage className="space-y-6">
      <MentorPageHeader
        title={greeting(profile.firstName)}
        subtitle={fmtDay()}
        meta={
          <>
            <span className="font-medium text-foreground tabular-nums">{stats.pending_reviews}</span> reviews pending
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            <span className="font-medium text-foreground tabular-nums">{stats.mentees}</span> mentees
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KeyMetricCard icon={ClipboardList} tone="blue" label="Pending reviews" value={String(stats.pending_reviews)} />
        <KeyMetricCard icon={TrendingUp} tone="violet" label="Completed" value={String(stats.completed_reviews)} />
        <KeyMetricCard icon={Users} tone="cyan" label="Mentees" value={String(stats.mentees)} />
        <KeyMetricCard
          icon={Clock}
          tone={stats.escalations > 0 ? "amber" : "green"}
          label="Open escalations"
          value={String(stats.escalations)}
        />
      </div>

      <SplitPanel
        aside={
          <div className="space-y-5">
            <DashboardSection title="Queue glance" viewAllHref="/mentor/queue" viewAllLabel="Open queue">
              <dl className="space-y-3">
                <GlanceRow label="Pending" value={String(stats.pending_reviews)} />
                <GlanceRow label="Completed" value={String(stats.completed_reviews)} />
                <GlanceRow label="Total reviews" value={String(stats.total_reviews)} />
                <GlanceRow label="Escalations" value={String(stats.escalations)} warn={stats.escalations > 0} />
              </dl>
            </DashboardSection>
          </div>
        }
      >
        <div className="space-y-5">
          {assignedSows.length > 0 && (
            <DashboardSection title={`Assigned SOWs (${assignedSows.length})`}>
              <ul className="divide-y divide-stroke-subtle -mx-5 -mb-5">
                {assignedSows.map((s) => (
                  <li key={s.sowId}>
                    <Link
                      href={`/mentor/sow/${encodeURIComponent(s.sowId)}`}
                      className="px-5 py-3 flex items-center gap-3 hover:bg-surface-hover transition-colors duration-fast"
                    >
                      <FileText className="h-4 w-4 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="font-body text-[13px] font-medium text-foreground truncate">{s.title}</p>
                        <p className="font-body text-[11.5px] text-text-tertiary truncate">
                          {s.ownerEmail ? `From ${s.ownerEmail}` : s.sowId}
                          {s.stage ? ` · ${s.stage}` : ""}
                        </p>
                      </div>
                      <span className="font-body text-[10.5px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-brand-subtle text-brand-subtle-text shrink-0">
                        {s.assignmentStatus || "assigned"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </DashboardSection>
          )}
          {hero ? (
            <DashboardSection eyebrow="Priority" title="Next review">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <h3 className="font-body text-[17px] font-semibold text-foreground tracking-[-0.01em] leading-tight">
                    {hero.title}
                  </h3>
                  <p className="mt-1.5 font-body text-[12.5px] text-text-secondary">
                    {hero.contributor_name ? `Submitted by ${hero.contributor_name}` : "Submission"} {fmtRelative(hero.created_at)}
                    {hero.priority && (
                      <>
                        <span aria-hidden className="opacity-50 mx-1.5">·</span>
                        <StatusChip status={hero.priority === "urgent" || hero.priority === "high" ? "warning" : "info"} size="sm">
                          {hero.priority}
                        </StatusChip>
                      </>
                    )}
                  </p>
                  {hero.submission_type && (
                    <p className="mt-1 font-body text-[12px] text-text-tertiary capitalize">{hero.submission_type}</p>
                  )}
                </div>
                <Link href={`/mentor/queue/${hero.id}`} className={mentorPrimaryBtn}>
                  Open review →
                </Link>
              </div>
            </DashboardSection>
          ) : (
            <DashboardSection title="Queue clear">
              <p className="font-body text-[13.5px] font-semibold text-foreground">You&apos;re all caught up</p>
              <p className="mt-1 font-body text-[12.5px] text-text-tertiary">
                New reviews appear here when contributors submit work routed to you.
              </p>
            </DashboardSection>
          )}

          <DashboardSection
            title={`Pending reviews (${recent_queue.length})`}
            viewAllHref="/mentor/queue"
            viewAllLabel="Open queue"
          >
            {recent_queue.length === 0 ? (
              <p className="font-body text-[12.5px] text-text-tertiary italic">No pending reviews.</p>
            ) : (
              <ul className="divide-y divide-stroke-subtle -mx-5 -mb-5">
                {recent_queue.map((r) => (
                  <MentorListRow
                    key={r.id}
                    href={`/mentor/queue/${r.id}`}
                    title={r.title}
                    meta={[r.contributor_name, r.submission_type, r.priority].filter(Boolean).join(" · ")}
                    trailing={
                      <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums">
                        {fmtRelative(r.created_at)}
                      </span>
                    }
                  />
                ))}
              </ul>
            )}
          </DashboardSection>
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
