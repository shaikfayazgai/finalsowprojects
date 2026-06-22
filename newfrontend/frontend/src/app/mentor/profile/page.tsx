"use client";

/**
 * Mentor profile — spec doc 03 §5.H.1.
 * Identity + admin-set Competency (view-only) + stats + mentorship counts.
 */

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  Clock,
  Globe,
  Pencil,
  Target,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  MentorBanner,
  MentorPage,
  MentorPageHeader,
  mentorSecondaryBtn,
} from "@/app/mentor/_components/mentor-ui";
import { DashboardSection, KeyMetricCard } from "@/components/meridian/dashboard";
import { Avatar, StatusChip } from "@/components/meridian";
import { useActiveMentor } from "@/lib/hooks/use-active-mentor";
import {
  fetchMentorDecisions,
  fetchMentorMentorshipStats,
  MentorApiError,
  type MentorshipStatsResponse,
} from "@/lib/api/mentor-mock";
import { MOCK_MENTOR_METRICS } from "@/mocks/mentor";

function fmtJoined(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export default function MentorProfilePage() {
  const { profile } = useActiveMentor();
  const [m, setM] = React.useState<typeof MOCK_MENTOR_METRICS | null>(null);
  const [ms, setMs] = React.useState<MentorshipStatsResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const c = new AbortController();
    fetchMentorDecisions(c.signal)
      .then((res) => setM(res.metrics))
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError") return;
        setError(err instanceof MentorApiError ? err.message : "Could not load metrics.");
      });
    fetchMentorMentorshipStats(c.signal)
      .then(setMs)
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError") return;
        /* non-fatal — the tile falls back to a loading dash */
      });
    return () => c.abort();
  }, []);

  return (
    <MentorPage>
      <MentorPageHeader
        title={profile.displayName}
        subtitle={profile.title}
        meta={
          <>
            Mentor since {fmtJoined(profile.joinedAt)}
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            {profile.country} / {profile.timezone}
          </>
        }
        actions={
          <Link href="/mentor/profile/edit" className={mentorSecondaryBtn}>
            <Pencil className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Edit profile
          </Link>
        }
      />

      {error && (
        <MentorBanner
          tone="error"
          icon={<AlertCircle className="h-4 w-4" strokeWidth={2} aria-hidden />}
        >
          {error}
        </MentorBanner>
      )}

      <DashboardSection title="Identity" description="Your mentor profile as contributors see it">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar initials={profile.avatarInitials} size="xl" tone="brand" />
          <div className="min-w-0 flex-1">
            <p className="font-body text-[15.5px] font-semibold text-foreground">{profile.displayName}</p>
            <p className="mt-0.5 font-body text-[12.5px] text-text-secondary">{profile.title}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusChip status="info" size="sm">
                {profile.role.replace(".", " ")}
              </StatusChip>
              <StatusChip status="neutral" size="sm">
                <Globe className="h-3 w-3" strokeWidth={2} aria-hidden />
                {profile.timezone}
              </StatusChip>
            </div>
          </div>
        </div>
      </DashboardSection>

      <DashboardSection
        title="Competency"
        description="Skills and level bands you're eligible to review"
        actions={<StatusChip status="neutral" size="sm">Admin-set · view only</StatusChip>}
      >
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-3">
          Eligible to review
        </p>
        <ul className="space-y-2">
          {profile.competency.map((c, i) => (
            <li
              key={i}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-stroke-subtle bg-bg-subtle/40 px-3 py-2.5 font-body text-[12.5px] text-foreground"
            >
              <span className="font-medium">{c.skill}</span>
              <StatusChip status="info" size="sm">
                L{c.levelMin}–L{c.levelMax}
              </StatusChip>
            </li>
          ))}
        </ul>
      </DashboardSection>

      <DashboardSection
        title="Stats"
        description="Performance over the last 30 days"
        bare
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <KeyMetricCard
            icon={Target}
            tone="blue"
            label="Reviews"
            value={m ? String(m.reviewCount) : "…"}
          />
          <KeyMetricCard
            icon={Timer}
            tone="violet"
            label="Avg time"
            value={m ? `${m.avgTimeMin} min` : "…"}
          />
          <KeyMetricCard
            icon={TrendingUp}
            tone="green"
            label="SLA hit"
            value={m ? `${m.slaHitPct}%` : "…"}
          />
          <KeyMetricCard
            icon={Clock}
            tone="cyan"
            label="Accept rate"
            value={m ? `${m.acceptPct}%` : "…"}
          />
        </div>
      </DashboardSection>

      <DashboardSection title="Mentorship" description="Activity this month">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <KeyMetricCard
            icon={Users}
            tone="amber"
            label="Sessions held"
            value={ms ? String(ms.sessionsHeld) : "…"}
            hint="Scheduled mentorship sessions completed this month"
          />
          <KeyMetricCard
            icon={Users}
            tone="green"
            label="Active mentees"
            value={ms ? String(ms.activeMentees) : "…"}
            hint="Contributors currently in your mentorship roster"
          />
        </div>
      </DashboardSection>
    </MentorPage>
  );
}
