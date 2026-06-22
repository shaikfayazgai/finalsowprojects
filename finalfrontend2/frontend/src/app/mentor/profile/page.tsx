"use client";

/**
 * Mentor profile — spec doc 03 §5.H.1.
 * Identity + admin-set Competency (view-only) + stats + mentorship counts.
 *
 * Data source: GET /api/mentor/me → /api/v1/mentor/me (real backend).
 * Stats derived from GET /api/mentor/dashboard (real backend).
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

// ── Dashboard stats from real backend ────────────────────────────────────────

interface DashStats {
  pending_reviews: number;
  completed_reviews: number;
  total_reviews: number;
  mentees: number;
  escalations: number;
}

function fmtJoined(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export default function MentorProfilePage() {
  const { profile, loading: profileLoading, error: profileError } = useActiveMentor();
  const [stats, setStats] = React.useState<DashStats | null>(null);
  const [statsError, setStatsError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const c = new AbortController();
    fetch("/api/mentor/dashboard", { signal: c.signal, cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Dashboard unavailable (${res.status})`);
        return res.json() as Promise<{
          success?: boolean;
          data?: { stats?: DashStats };
          stats?: DashStats;
        }>;
      })
      .then((body) => {
        // Backend wraps in { success, data: { stats } } via _ok() helper.
        const s = body?.data?.stats ?? (body?.stats as DashStats | undefined) ?? null;
        if (!c.signal.aborted) setStats(s);
      })
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError") return;
        if (!c.signal.aborted) {
          setStatsError(err instanceof Error ? err.message : "Could not load stats.");
        }
      });
    return () => c.abort();
  }, []);

  const error = profileError ?? statsError;

  return (
    <MentorPage>
      <MentorPageHeader
        title={profile.displayName}
        subtitle={profile.title}
        meta={
          profileLoading ? (
            <span className="inline-block h-3 w-48 rounded bg-bg-subtle animate-pulse" />
          ) : (
            <>
              Mentor since {fmtJoined(profile.joinedAt)}
              <span aria-hidden className="opacity-50 mx-1.5">·</span>
              {profile.country} / {profile.timezone}
            </>
          )
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
        {profile.competency.length === 0 ? (
          <p className="font-body text-[12.5px] text-text-tertiary italic">
            No competency bands assigned yet.
          </p>
        ) : (
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
        )}
      </DashboardSection>

      <DashboardSection
        title="Stats"
        description="Your review activity"
        bare
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <KeyMetricCard
            icon={Target}
            tone="blue"
            label="Total reviews"
            value={stats ? String(stats.total_reviews) : "…"}
          />
          <KeyMetricCard
            icon={Timer}
            tone="violet"
            label="Pending"
            value={stats ? String(stats.pending_reviews) : "…"}
          />
          <KeyMetricCard
            icon={TrendingUp}
            tone="green"
            label="Completed"
            value={stats ? String(stats.completed_reviews) : "…"}
          />
          <KeyMetricCard
            icon={Clock}
            tone="cyan"
            label="Escalations"
            value={stats ? String(stats.escalations) : "…"}
          />
        </div>
      </DashboardSection>

      <DashboardSection title="Mentorship" description="Active mentee relationships">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <KeyMetricCard
            icon={Users}
            tone="amber"
            label="Active mentees"
            value={stats ? String(stats.mentees) : "…"}
            hint="Contributors currently in your mentorship roster"
          />
          <KeyMetricCard
            icon={Users}
            tone="green"
            label="Open escalations"
            value={stats ? String(stats.escalations) : "…"}
            hint="Escalations currently open or in progress"
          />
        </div>
      </DashboardSection>
    </MentorPage>
  );
}
