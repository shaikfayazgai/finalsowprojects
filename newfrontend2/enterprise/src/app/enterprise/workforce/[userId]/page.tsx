"use client";

/**
 * Internal employee — full record page (was a drawer).
 * Header card · delivery snapshot KPIs · two-column record (skills + access | roster).
 */

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Briefcase, Building2, CheckCircle2, Clock, Shield, UserRound } from "lucide-react";
import { useWorkforceDirectory } from "@/lib/hooks/use-workforce";
import { Skeleton } from "@/components/meridian";
import type { WorkforceMember } from "@/lib/workforce/types";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import { Chip, StatCard, secondaryBtnClass } from "@/app/admin/_shell/aurora-ui";

/** Demo delivery stats — stable per userId until backend ships. */
function mockDeliveryStats(userId: string) {
  const n = userId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return {
    activeTasks: n % 4,
    completedTasks: 8 + (n % 22),
    acceptanceRate: 88 + (n % 10),
    lastActiveDays: 1 + (n % 6),
  };
}

function BackLink() {
  return (
    <Link
      href="/enterprise/workforce"
      className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
      Back to workforce
    </Link>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className={cn(DASH_CARD, "overflow-hidden")}>
      <div className="px-5 sm:px-6 py-4 border-b border-stroke-subtle">
        <h2 className="font-display text-[14px] font-bold tracking-[-0.01em] text-foreground">{title}</h2>
        {description ? <p className="mt-0.5 font-body text-[12px] text-text-tertiary">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">{label}</dt>
      <dd className={cn("mt-1 font-body text-[13px] text-foreground break-words", mono && "font-mono text-[12px]")}>{value}</dd>
    </div>
  );
}

function AccessRow({ icon: Icon, title, body }: { icon: typeof Shield; title: string; body: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 text-text-tertiary shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
      <div>
        <p className="font-body text-[12.5px] font-semibold text-foreground">{title}</p>
        <p className="font-body text-[11.5px] text-text-secondary mt-0.5 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const params = useParams<{ userId: string }>();
  const userId = decodeURIComponent(params?.userId ?? "");
  const { data, isLoading } = useWorkforceDirectory({});
  const member: WorkforceMember | undefined = data?.items.find((m) => m.userId === userId);

  if (isLoading && !data) return <DetailSkeleton />;

  if (!member) {
    return (
      <div className="space-y-4 pb-12 animate-fade-in">
        <BackLink />
        <div className={cn(DASH_CARD, "px-4 py-12 text-center")}>
          <p className="font-body text-[13px] font-semibold text-foreground">Employee not found</p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary">They may have been removed from the roster.</p>
        </div>
      </div>
    );
  }

  const inactive = member.status === "inactive";
  const stats = mockDeliveryStats(member.userId);
  const availability = member.availability != null && member.availability !== "" ? `${member.availability} hrs / week` : "—";
  const initials =
    member.displayName
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <BackLink />

      {/* Identity header */}
      <header className={cn(DASH_CARD, "p-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between")}>
        <div className="flex items-start gap-4 min-w-0">
          <span className={cn("grid place-items-center h-14 w-14 rounded-xl font-display text-[18px] font-bold shrink-0", inactive ? "bg-bg-subtle text-text-disabled border border-stroke-subtle" : "text-white")} style={inactive ? undefined : GLASS_GRADIENT} aria-hidden>
            {initials}
          </span>
          <div className="min-w-0">
            <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">Internal employee</p>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-[22px] sm:text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">{member.displayName}</h1>
              <Chip tone="ai" dot={false}>Internal</Chip>
              <Chip tone={inactive ? "neutral" : "success"} dot={false}>{inactive ? "Inactive" : "Active"}</Chip>
            </div>
            <p className="mt-2 font-body text-[12.5px] text-text-tertiary">
              {member.department ?? "—"} · <span className="font-mono">{member.email}</span>
            </p>
          </div>
        </div>

        <Link href="/enterprise/projects" className={cn(secondaryBtnClass, "shrink-0")}>
          <Briefcase className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Assign from project
        </Link>
      </header>

      {/* Delivery snapshot */}
      <section aria-label="Delivery snapshot" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active tasks" value={stats.activeTasks} icon={Briefcase} />
        <StatCard label="Completed" value={stats.completedTasks} icon={CheckCircle2} />
        <StatCard label="Acceptance" value={`${stats.acceptanceRate}%`} icon={UserRound} />
        <StatCard label="Last active" value={`${stats.lastActiveDays}d`} icon={Clock} hint="ago" />
      </section>

      {/* Two-column record */}
      <div className="grid gap-5 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 space-y-5 min-w-0">
          <Section title="Skills & capacity" description="Used for matching and direct assignment">
            <div className="px-5 sm:px-6 py-5 space-y-4">
              <div>
                <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-2">Primary skills</p>
                {member.primarySkills.length > 0 ? (
                  <ul className="flex flex-wrap gap-1.5">
                    {member.primarySkills.map((skill) => (
                      <li key={skill} className="inline-flex items-center h-[26px] px-2.5 rounded-md bg-bg-subtle border border-stroke-subtle font-body text-[12px] font-medium text-text-secondary">
                        {skill}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-body text-[13px] text-text-tertiary">No skills listed.</p>
                )}
              </div>
              <div className="pt-4 border-t border-stroke-subtle">
                <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1">Availability</p>
                <p className="font-body text-[13px] text-foreground">{availability}</p>
              </div>
            </div>
          </Section>

          <Section title="Access" description="How this employee signs in to Glimmora">
            <div className="px-5 sm:px-6 py-5 space-y-4">
              <AccessRow icon={Shield} title="Company SSO" body="Password managed by your organization. The employee signs in with their work email." />
              <AccessRow icon={Building2} title="Acme Corp tenant" body="Visible under My organization for direct assignment to project tasks." />
            </div>
          </Section>
        </div>

        <div className="space-y-5">
          <Section title="Roster" description="Synced from CSV / HR export">
            <dl className="px-5 sm:px-6 py-5 grid grid-cols-1 gap-y-4">
              <Fact label="Employee ID" value={member.employeeId ?? "—"} mono />
              <Fact label="Department" value={member.department ?? "—"} />
              <Fact label="Manager" value={member.managerEmail ?? "—"} mono />
              <Fact label="Cost center" value={member.costCenter ?? "—"} mono />
            </dl>
          </Section>
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Skeleton className="h-4 w-32" />
      <div className={cn(DASH_CARD, "p-5 flex items-start gap-4")}>
        <Skeleton className="h-14 w-14 rounded-xl" />
        <div className="space-y-2.5">
          <Skeleton className="h-2.5 w-28" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-3 items-start">
        <Skeleton className="h-56 rounded-xl lg:col-span-2" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}
