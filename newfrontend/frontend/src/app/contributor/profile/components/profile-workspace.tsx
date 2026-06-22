"use client";

/**
 * Profile overview — editorial identity + skills + digital twin snapshot.
 */

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  Award,
  Calendar,
  ChevronRight,
  Clock,
  FileText,
  Globe,
  GraduationCap,
  MapPin,
  Pencil,
  Sparkles,
  Target,
} from "lucide-react";
import { DashboardSection } from "@/components/meridian/dashboard";
import { StatusChip } from "@/components/meridian";
import { OrgChip } from "@/components/contributor/persona-modules";
import { useActivePersona } from "@/lib/hooks/use-active-persona";
import { useContributorProfileIndex } from "@/lib/hooks/use-contributor-profile";
import { PERSONAS } from "@/mocks/contributor/personas";
import type { MockSkill } from "@/mocks/contributor";
import { cn } from "@/lib/utils/cn";
import { ProfileSkeleton } from "./profile-skeleton";
import {
  fmtJoined,
  fmtShortDate,
  levelTone,
  reliabilityBand,
  reliabilityChip,
  reliabilityLabel,
  skillCategoryLabel,
  type ProfileRecentTask,
} from "../lib/profile-ui-utils";

export function ProfileWorkspace() {
  const { profile, persona, isLoading: personaLoading } = useActivePersona();
  const { data, isLoading, error, refetch } = useContributorProfileIndex();
  const loading = personaLoading || (isLoading && !data);

  if (loading) return <ProfileSkeleton />;

  const skills = data?.skills ?? [];
  const skillTotal = data?.skillTotal ?? 0;
  const twin = data?.twin ?? null;
  const recentTasks = data?.recentTasks ?? [];
  const availability = data?.availability;
  const institution = data?.institution ?? null;
  const topSkill = skills[0];
  const roleLabel = topSkill
    ? `${topSkill.name} · ${topSkill.level}`
    : "Contributor";
  const personaLabel = PERSONAS.find((p) => p.key === persona)?.shortLabel ?? persona;
  // Reliability needs real on-time signal — only show a band once the
  // contributor has completed tasks that actually carried a deadline.
  const band = twin && twin.onTimeTotal > 0 ? reliabilityBand(twin) : null;

  return (
    <div className="space-y-4 pb-12">
      {error ? (
        <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 flex flex-wrap items-center gap-3">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">{(error as Error).message}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="h-8 px-3 rounded-md bg-surface border border-stroke font-body text-[12px] font-semibold text-foreground hover:bg-surface-hover"
          >
            Retry
          </button>
        </div>
      ) : null}

      {/* Identity hero */}
      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-5 pb-4 bg-gradient-to-br from-brand-subtle/50 via-surface to-bg-subtle border-b border-stroke-subtle">
          <div className="flex flex-wrap items-start gap-5">
            <div
              aria-hidden
              className="h-16 w-16 rounded-full bg-brand text-on-brand inline-flex items-center justify-center font-body text-[20px] font-semibold shrink-0 ring-4 ring-surface shadow-sm"
            >
              {profile.avatarInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
                  {profile.displayName}
                </h1>
                <StatusChip status="neutral" size="sm">
                  {personaLabel}
                </StatusChip>
                {persona === "internal" ? <OrgChip /> : null}
              </div>
              <p className="mt-1 font-body text-[13px] text-text-secondary">{roleLabel}</p>
              {institution ? (
                <p className="mt-1 font-body text-[12px] text-text-secondary">{institution}</p>
              ) : null}
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-[11.5px] text-text-tertiary">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" strokeWidth={2} aria-hidden />
                  Joined {fmtJoined(profile.joinedAt)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" strokeWidth={2} aria-hidden />
                  {profile.country}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Globe className="h-3 w-3" strokeWidth={2} aria-hidden />
                  {profile.timezone}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Link
                href="/contributor/profile/edit"
                className={cn(
                  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shadow-xs",
                  "bg-brand text-on-brand font-body text-[13px] font-semibold",
                  "hover:bg-brand-hover transition-colors duration-fast",
                )}
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Edit profile
              </Link>
              <Link
                href="/contributor/profile/evidence"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-surface border border-stroke font-body text-[13px] font-semibold text-foreground hover:bg-surface-hover transition-colors duration-fast"
              >
                <FileText className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Evidence
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Persona-specific strip */}
      {persona === "student" && profile.supervision ? (
        <StudentSupervisionStrip supervision={profile.supervision} />
      ) : null}
      {persona === "women" && profile.womenSupport ? (
        <WomenSupportStrip support={profile.womenSupport} />
      ) : null}

      {/* Summary KPIs */}
      <DashboardSection
        title="Your record"
        description="Observations from your delivered work — not targets or rankings"
        actions={
          band ? (
            <StatusChip status={reliabilityChip(band)} size="sm">
              {reliabilityLabel(band)} reliability
            </StatusChip>
          ) : null
        }
      >
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-5">
          <SummaryStat
            label="Tasks taken"
            value={twin ? String(twin.tasksTaken) : "—"}
            highlight={Boolean(twin && twin.tasksTaken > 0)}
          />
          <SummaryStat
            label="Tasks completed"
            value={twin ? String(twin.tasksReinforcing) : "—"}
            highlight={Boolean(twin && twin.tasksReinforcing > 0)}
          />
          <SummaryStat
            label="Before deadline"
            value={twin && twin.onTimeTotal > 0 ? `${twin.onTimeCount}/${twin.onTimeTotal}` : "—"}
            sub={twin && twin.onTimeTotal > 0 ? `${twin.onTimePct}% on time` : undefined}
            highlight={Boolean(twin && twin.onTimeTotal > 0 && twin.onTimePct >= 85)}
          />
          <SummaryStat
            label="Avg rating"
            value={twin && twin.ratingCount > 0 ? `★ ${twin.averageReviewScore.toFixed(1)}` : "—"}
            sub={
              twin && twin.ratingCount > 0
                ? `${twin.ratingCount} review${twin.ratingCount === 1 ? "" : "s"}`
                : undefined
            }
            highlight={Boolean(twin && twin.ratingCount > 0 && twin.averageReviewScore >= 4)}
          />
          <SummaryStat
            label="Acceptance rate"
            value={twin ? `${twin.acceptanceRatePct}%` : "—"}
            highlight={Boolean(twin && twin.acceptanceRatePct >= 85)}
          />
          <SummaryStat
            label="Skills declared"
            value={String(skillTotal)}
            highlight={skillTotal > 0}
          />
        </dl>
        {!twin ? (
          <p className="mt-4 font-body text-[11.5px] text-text-tertiary leading-relaxed">
            Delivery metrics appear here after you complete and accept your first task.
          </p>
        ) : null}
      </DashboardSection>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
        <div className="space-y-4 min-w-0">
          {/* Skills */}
          <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
            <div className="px-5 pt-4 pb-0 border-b border-stroke-subtle">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
                <div>
                  <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                    Skills
                  </h2>
                  <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                    {skillTotal} declared at onboarding · reinforced by accepted deliveries
                  </p>
                </div>
                <Link
                  href="/contributor/profile/skills"
                  className="inline-flex items-center gap-1 font-body text-[12px] font-semibold text-text-link hover:underline shrink-0"
                >
                  Manage
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                </Link>
              </div>
            </div>
            {skills.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="font-body text-[13px] text-text-secondary">No skills declared yet.</p>
                <Link
                  href="/contributor/profile/skills"
                  className="mt-3 inline-flex h-8 items-center px-3 rounded-md bg-brand text-on-brand font-body text-[12px] font-semibold hover:bg-brand-hover"
                >
                  Add skills
                </Link>
              </div>
            ) : (
              <ul role="list" className="divide-y divide-stroke-subtle">
                {skills.map((skill) => (
                  <SkillRow key={skill.id} skill={skill} />
                ))}
              </ul>
            )}
          </section>

          {/* Recent contributions */}
          <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
            <div className="px-5 py-4 border-b border-stroke-subtle">
              <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                Recent contributions
              </h2>
              <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                Last {recentTasks.length} accepted deliveries
              </p>
            </div>
            {recentTasks.length === 0 ? (
              <p className="px-5 py-8 font-body text-[12.5px] text-text-tertiary text-center italic">
                No accepted contributions yet — complete a task to build your record.
              </p>
            ) : (
              <ul role="list" className="divide-y divide-stroke-subtle">
                {recentTasks.map((task) => (
                  <ContributionRow key={task.id} task={task} />
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-[calc(var(--shell-topbar-height,52px)+1rem)] xl:self-start xl:max-h-[calc(100dvh-var(--shell-topbar-height,52px)-2rem)] xl:overflow-y-auto xl:overscroll-y-contain">
          {/* Digital twin snapshot */}
          <DashboardSection
            title="Digital twin"
            description="30-day activity and delivery patterns"
            actions={
              <Link
                href="/contributor/profile/digital-twin"
                className="font-body text-[11.5px] font-semibold text-text-link hover:underline inline-flex items-center gap-0.5"
              >
                Full summary
                <ChevronRight className="h-3 w-3" strokeWidth={2} aria-hidden />
              </Link>
            }
          >
            {twin ? (
              <dl className="space-y-3">
                <RailItem label="Completed (30d)">{String(twin.tasksCompleted30d)}</RailItem>
                <RailItem label="In flight">{String(twin.tasksInFlight)}</RailItem>
                <RailItem label="First-try acceptance">{`${twin.firstTryAcceptPct}%`}</RailItem>
                <RailItem label="On-time delivery">
                  {twin.onTimeTotal > 0 ? `${twin.onTimePct}%` : "—"}
                </RailItem>
                {band ? (
                  <RailItem label="Reliability band">
                    <StatusChip status={reliabilityChip(band)} size="sm">
                      {reliabilityLabel(band)}
                    </StatusChip>
                  </RailItem>
                ) : null}
              </dl>
            ) : (
              <p className="font-body text-[12px] text-text-tertiary leading-relaxed">
                Activity and reliability counters are derived from accepted work — not collected
                during onboarding. They will populate after your first completed deliveries.
              </p>
            )}
            {twin ? (
              <p className="mt-4 pt-4 border-t border-stroke-subtle font-body text-[11px] text-text-tertiary leading-relaxed">
                These numbers describe how you work — they are not quotas or peer comparisons.
              </p>
            ) : null}
          </DashboardSection>

          {/* Availability — from onboarding */}
          {availability && availability.hoursPerWeek > 0 ? (
            <DashboardSection title="Availability" description="From onboarding — update in profile edit">
              <dl className="space-y-3">
                <RailItem label="Weekly capacity">{`${availability.hoursPerWeek}h`}</RailItem>
                <RailItem label="Timezone">{availability.timezone}</RailItem>
              </dl>
            </DashboardSection>
          ) : null}

          {/* Quick links */}
          <div className="rounded-xl border border-stroke-subtle bg-surface p-5 space-y-2">
            <h3 className="font-body text-[13px] font-semibold text-foreground">Profile tools</h3>
            <QuickLink
              href="/contributor/credentials"
              icon={Award}
              title="Credential wallet"
              description="Share verified delivery records"
            />
            <QuickLink
              href="/contributor/profile/digital-twin"
              icon={Sparkles}
              title="Digital twin"
              description="Full activity and reliability view"
            />
            <QuickLink
              href="/contributor/profile/skills"
              icon={Target}
              title="Skill registry"
              description="Add, remove, and link evidence"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function SkillRow({ skill }: { skill: MockSkill }) {
  return (
    <li>
      <Link
        href={`/contributor/profile/skills/${skill.id}`}
        className={cn(
          "flex items-center justify-between gap-3 px-5 py-3.5 min-h-[56px]",
          "hover:bg-bg-subtle/60 transition-colors duration-fast",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-body text-[13px] font-semibold text-foreground">{skill.name}</span>
            <span
              className={cn(
                "inline-flex items-center px-1.5 py-0.5 rounded border font-mono text-[10px] font-semibold tabular-nums",
                levelTone(skill.level),
              )}
            >
              {skill.level}
            </span>
          </span>
          <span className="mt-0.5 block font-body text-[11px] text-text-tertiary">
            {skillCategoryLabel(skill.category)} · {skill.level}
            {skill.tasksCompletedWithThisSkill > 0
              ? ` · ${skill.tasksCompletedWithThisSkill} tasks`
              : ""}
            {skill.evidenceCount > 0 ? ` · ${skill.evidenceCount} evidence` : ""}
          </span>
        </span>
        <ChevronRight className="h-4 w-4 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
      </Link>
    </li>
  );
}

function ContributionRow({ task }: { task: ProfileRecentTask }) {
  return (
    <li>
      <Link
        href={`/contributor/tasks/completed/${task.id}`}
        className={cn(
          "flex items-center justify-between gap-3 px-5 py-3 min-h-[56px]",
          "hover:bg-bg-subtle/60 transition-colors duration-fast",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="block font-body text-[12.5px] font-medium text-foreground truncate">
            {task.title}
          </span>
          <span className="mt-0.5 block font-body text-[11px] text-text-tertiary truncate">
            {task.tenantName}
          </span>
        </span>
        <span className="flex items-center gap-2 shrink-0">
          <StatusChip status="success" size="sm">
            Accepted
          </StatusChip>
          <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums w-14 text-right">
            {fmtShortDate(task.decidedAt ?? task.assignedAt)}
          </span>
        </span>
      </Link>
    </li>
  );
}

function StudentSupervisionStrip({
  supervision,
}: {
  supervision: NonNullable<import("@/mocks/contributor/personas").PersonaProfile["supervision"]>;
}) {
  return (
    <div className="rounded-xl border border-stroke-subtle bg-surface px-5 py-4 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand-subtle-text border border-brand/20">
          <GraduationCap className="h-4 w-4" strokeWidth={2} aria-hidden />
        </span>
        <div>
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
            Student · Supervision
          </p>
          <p className="mt-0.5 font-body text-[13px] font-semibold text-foreground">
            {supervision.supervisorName} · {supervision.institution}
          </p>
          <p className="mt-0.5 font-body text-[11.5px] text-text-secondary">
            {supervision.isApproved ? "Approved for this term" : "Approval pending"}
          </p>
        </div>
      </div>
      <StatusChip status={supervision.isApproved ? "success" : "pending"} size="sm">
        {supervision.isApproved ? "Approved" : "Pending"}
      </StatusChip>
    </div>
  );
}

function WomenSupportStrip({
  support,
}: {
  support: NonNullable<import("@/mocks/contributor/personas").PersonaProfile["womenSupport"]>;
}) {
  const checkIn = new Date(support.nextCheckIn.iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="rounded-xl border border-stroke-subtle bg-surface px-5 py-4 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
          Your support
        </p>
        <p className="mt-0.5 font-body text-[13px] font-semibold text-foreground">
          Peer mentor · {support.peerMentor.name}
        </p>
        <p className="mt-0.5 font-body text-[11.5px] text-text-secondary inline-flex items-center gap-1">
          <Clock className="h-3 w-3" strokeWidth={2} aria-hidden />
          Next check-in {checkIn} ({support.nextCheckIn.durationMin}m)
        </p>
      </div>
      <Link
        href="/contributor/support"
        className="inline-flex items-center gap-1 font-body text-[12px] font-semibold text-text-link hover:underline shrink-0"
      >
        Support hub
        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      </Link>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
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
      {sub ? (
        <p className="mt-0.5 font-body text-[10.5px] text-text-tertiary tabular-nums">{sub}</p>
      ) : null}
    </div>
  );
}

function RailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary shrink-0 pt-0.5">
        {label}
      </dt>
      <dd className="font-body text-[12.5px] text-foreground text-right min-w-0">{children}</dd>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-start gap-2.5 rounded-lg px-3 py-2.5 -mx-1",
        "hover:bg-bg-subtle/60 transition-colors duration-fast",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25",
      )}
    >
      <Icon className="h-4 w-4 text-text-secondary shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
      <span className="min-w-0">
        <span className="block font-body text-[12.5px] font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 block font-body text-[11px] text-text-tertiary leading-snug">
          {description}
        </span>
      </span>
    </Link>
  );
}
