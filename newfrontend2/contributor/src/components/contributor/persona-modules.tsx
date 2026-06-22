"use client";

/**
 * Persona-conditional dashboard modules — spec §5.C.3.
 *
 * Slot between Lifecycle (above) and Earnings (below) on the dashboard.
 * Three module types:
 *   - SupervisionModule  (student)              §5.C.3.b
 *   - YourSupportModule  (women workforce)      §5.C.3.c
 *   - OrgChip            (internal employee)    §5.C.3.a — renders in header, not as a module card
 *
 * External freelancer renders nothing (§5.C.3.d).
 *
 * Multi-track contributors render student-first then women (§5.C.3.e),
 * capped at two.
 */

import * as React from "react";
import Link from "next/link";
import { Calendar, Mail, AlertTriangle, ShieldAlert, FileText } from "lucide-react";
import { DashboardSection } from "@/components/meridian/dashboard";
import { useActivePersona } from "@/lib/hooks/use-active-persona";
import { cn } from "@/lib/utils/cn";

/* ─────────────────────── orchestrator ─────────────────────── */

export function PersonaDashboardModules() {
  const { persona, profile } = useActivePersona();
  switch (persona) {
    case "student":
      return profile.supervision ? <SupervisionModule data={profile.supervision} /> : null;
    case "women":
      return profile.womenSupport ? <YourSupportModule data={profile.womenSupport} /> : null;
    case "internal":
    case "freelancer":
    default:
      return null;
  }
}

/** Header chip for internal employees (§5.C.3.a). Render next to the date. */
export function OrgChip() {
  const { persona, profile } = useActivePersona();
  if (persona !== "internal" || !profile.orgChip) return null;
  return (
    <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full bg-bg-subtle border border-stroke font-body text-[11px] text-text-secondary">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand" />
      <span className="text-text-tertiary">{profile.orgChip.tenant}</span>
      <span aria-hidden className="opacity-50">·</span>
      <span className="font-medium text-foreground">{profile.orgChip.department}</span>
    </span>
  );
}

/* ─────────────────────── §5.C.3.b Supervision (student) ─────────────────────── */

interface SupervisionData {
  supervisorName: string;
  institution: string;
  supervisorEmail: string;
  isApproved: boolean;
  approvedAt: string | null;
  creditTasksTotal: number;
  creditTasksCompleted: number;
  termEndsAt: string | null;
}

function SupervisionModule({ data }: { data: SupervisionData }) {
  const termDate = data.termEndsAt ? new Date(data.termEndsAt) : null;
  const daysToTermEnd = termDate
    ? Math.floor((termDate.getTime() - Date.now()) / 86_400_000)
    : null;
  const termFmt = termDate
    ? termDate.toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" })
    : null;
  const pct =
    data.creditTasksTotal > 0
      ? Math.round((data.creditTasksCompleted / data.creditTasksTotal) * 100)
      : 0;

  const expiredOneYear =
    data.isApproved &&
    data.approvedAt &&
    Date.now() - new Date(data.approvedAt).getTime() > 365 * 86_400_000;
  const termEndingSoon =
    daysToTermEnd != null && daysToTermEnd <= 7 && daysToTermEnd > 0;
  const creditConfigured = data.creditTasksTotal > 0;

  return (
    <DashboardSection
      eyebrow="Student track"
      title="Supervision"
      description={
        !data.isApproved
          ? "Faculty coordinator approval pending for this term"
          : "Your supervisor for this term"
      }
    >
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div
            aria-hidden
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-subtle text-brand-subtle-text font-body text-[12px] font-semibold shrink-0"
          >
            {data.supervisorName
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-body text-[13px] font-semibold text-foreground">
              {data.supervisorName}
            </p>
            <p className="font-body text-[12px] text-text-secondary">{data.institution}</p>
            {!data.isApproved ? (
              <p className="mt-1 font-body text-[11.5px] text-text-secondary">
                Supervisor approval pending — your faculty coordinator will confirm your
                participation for this term.
              </p>
            ) : expiredOneYear ? (
              <p className="mt-1 inline-flex items-center gap-1 font-body text-[11.5px] font-semibold text-warning-text">
                <AlertTriangle className="h-3 w-3" strokeWidth={2} aria-hidden />
                Renew supervisor approval to continue
              </p>
            ) : (
              <p className="mt-1 font-body text-[11.5px] text-success-text">
                ✓ Approved your participation this term
              </p>
            )}
          </div>
        </div>

        {creditConfigured && (
          <div className="pt-2 border-t border-stroke-subtle">
            <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
              Academic recognition
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full bg-bg-subtle overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full"
                  style={{ width: `${pct}%` }}
                  aria-hidden
                />
              </div>
              <span className="font-mono text-[11px] text-text-secondary tabular-nums shrink-0">
                {data.creditTasksCompleted} of {data.creditTasksTotal}
              </span>
            </div>
            <p className="mt-1.5 font-body text-[11.5px] text-text-secondary">
              tasks counting toward your internship credit
            </p>
          </div>
        )}

        {termFmt && (
          <div className="pt-2 border-t border-stroke-subtle">
            <p className="font-body text-[11.5px] text-text-secondary">
              <Calendar
                className="inline-block h-3 w-3 mr-1 align-text-bottom text-text-tertiary"
                strokeWidth={2}
                aria-hidden
              />
              Term ends: <span className="font-medium text-foreground">{termFmt}</span>
              {termEndingSoon && (
                <span className="ml-2 inline-flex items-center gap-1 text-warning-text font-semibold">
                  <AlertTriangle className="h-3 w-3" strokeWidth={2} aria-hidden />
                  Wrap up tasks before then
                </span>
              )}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <a
            href={`mailto:${encodeURIComponent(data.supervisorEmail)}?subject=${encodeURIComponent("GlimmoraTeam — student supervision")}`}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-surface border border-stroke font-body text-[12px] font-semibold text-foreground hover:bg-surface-hover transition-colors duration-fast"
          >
            <Mail className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Contact supervisor
          </a>
        </div>
      </div>
    </DashboardSection>
  );
}

/* ─────────────────────── §5.C.3.c Your support (women workforce) ─────────────────────── */

interface WomenSupportData {
  peerMentor: { name: string; initials: string };
  nextCheckIn: { iso: string; durationMin: number };
  activePreferences: string[];
  openSafetyCaseRef?: string;
}

function YourSupportModule({ data }: { data: WomenSupportData }) {
  const checkIn = new Date(data.nextCheckIn.iso);
  const checkInLabel = checkIn.toLocaleDateString(undefined, {
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <DashboardSection
      eyebrow="Women workforce"
      title="Your support"
      description="Peer mentor and programme preferences"
      actions={
        data.openSafetyCaseRef ? (
          <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-warning-subtle border border-warning-border font-body text-[10.5px] font-semibold text-warning-text">
            <ShieldAlert className="h-3 w-3" strokeWidth={2} aria-hidden />
            Case {data.openSafetyCaseRef}
          </span>
        ) : undefined
      }
    >
      <div className="divide-y divide-stroke-subtle -mx-5 -mb-5">
        <div className="p-4 space-y-2">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
            Peer mentor
          </p>
          <div className="flex items-center gap-3">
            <div
              aria-hidden
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-subtle text-brand-subtle-text font-body text-[11px] font-semibold"
            >
              {data.peerMentor.initials}
            </div>
            <div>
              <p className="font-body text-[13px] font-semibold text-foreground">
                {data.peerMentor.name}
              </p>
              <p className="font-body text-[11.5px] text-text-secondary">
                Next check-in: {checkInLabel} · {data.nextCheckIn.durationMin} min
              </p>
            </div>
          </div>
        </div>
        {data.activePreferences.length > 0 && (
          <div className="p-4 space-y-2">
            <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
              Preferences active
            </p>
            <ul className="space-y-1">
              {data.activePreferences.map((pref) => (
                <li
                  key={pref}
                  className="font-body text-[11.5px] text-text-secondary flex items-start gap-1.5"
                >
                  <span className="text-success-text shrink-0">✓</span>
                  {pref}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="p-4 flex flex-wrap gap-2">
          <Link
            href="/contributor/support"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-surface border border-stroke font-body text-[12px] font-semibold text-foreground hover:bg-surface-hover transition-colors duration-fast"
          >
            <FileText className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Report concern
          </Link>
          <Link
            href="/contributor/support/grievances"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md font-body text-[12px] font-semibold text-text-link hover:bg-bg-subtle transition-colors duration-fast"
          >
            Open grievance
          </Link>
        </div>
      </div>
    </DashboardSection>
  );
}
