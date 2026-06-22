"use client";

/**
 * Mentorship sessions — spec doc 03 §5.G.1.
 * Real sessions from contributor opt-in → system assignment.
 */

import * as React from "react";
import Link from "next/link";
import { ExternalLink, Copy, Check, AlertCircle } from "lucide-react";
import type { SessionDetailEnriched } from "@/lib/mentorship/enrichment";
import { useMentorSessions } from "@/lib/hooks/use-mentor-mentorship";
import { DashboardSection } from "@/components/meridian/dashboard";
import {
  MentorPage,
  MentorPageHeader,
  MentorBanner,
  MentorListPanel,
  MentorListRow,
  mentorPrimaryBtn,
  mentorSecondaryBtn,
} from "@/app/mentor/_components/mentor-ui";
import { MentorListSkeleton } from "@/app/mentor/_components/mentor-skeletons";
import { cn } from "@/lib/utils/cn";

function isToday(iso: string) {
  const d = new Date(iso);
  const t = new Date();
  return d.toDateString() === t.toDateString();
}
function isUpcoming(iso: string) {
  return new Date(iso).getTime() > Date.now() && !isToday(iso);
}
function isHeld(s: SessionDetailEnriched) {
  return s.status === "held";
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
}
function fmtDay(iso: string) {
  const d = new Date(iso);
  const t = new Date();
  if (d.toDateString() === t.toDateString()) return "Today";
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function MentorshipPage() {
  const { data, isLoading, error } = useMentorSessions();
  const all = data?.items ?? [];
  const today = all.filter((s) => isToday(s.scheduledAt) && s.status === "scheduled");
  const upcoming = all.filter((s) => isUpcoming(s.scheduledAt) && s.status === "scheduled");
  const held = all.filter(isHeld);

  return (
    <MentorPage>
      <MentorPageHeader
        title="Mentorship sessions"
        subtitle="Sessions scheduled by the system from contributor opt-ins."
      />

      {error && (
        <MentorBanner tone="error" icon={<AlertCircle className="h-4 w-4" strokeWidth={2} aria-hidden />}>
          Could not load sessions.
        </MentorBanner>
      )}

      {isLoading ? (
        <MentorListSkeleton rows={4} />
      ) : (
        <>
          <DashboardSection title={`Today (${today.length})`} bare>
            {today.length === 0 ? (
              <p className="rounded-xl border border-stroke-subtle bg-surface px-5 py-4 font-body text-[12.5px] text-text-tertiary italic">
                No sessions today.
              </p>
            ) : (
              <div className="grid gap-3">
                {today.map((s) => (
                  <TodayCard key={s.id} s={s} />
                ))}
              </div>
            )}
          </DashboardSection>

          <MentorListPanel
            title={`Upcoming (${upcoming.length})`}
            empty={
              upcoming.length === 0 ? (
                <p className="px-5 py-4 font-body text-[12.5px] text-text-tertiary italic">
                  Nothing on the calendar yet.
                </p>
              ) : undefined
            }
          >
            {upcoming.map((s) => (
              <MentorListRow
                key={s.id}
                href={`/mentor/mentorship/${s.id}`}
                title={s.contributorName}
                meta={`${s.focus} · ${s.durationMin} min`}
                trailing={
                  <span className="font-mono text-[11px] text-text-tertiary tabular-nums whitespace-nowrap shrink-0">
                    {fmtDay(s.scheduledAt)} · {fmtTime(s.scheduledAt)}
                  </span>
                }
              />
            ))}
          </MentorListPanel>

          <MentorListPanel
            title={`Held · ${held.length}`}
            empty={
              held.length === 0 ? (
                <p className="px-5 py-4 font-body text-[12.5px] text-text-tertiary italic">
                  No held sessions yet.
                </p>
              ) : undefined
            }
          >
            {held.map((s) => (
              <MentorListRow
                key={s.id}
                href={`/mentor/mentorship/${s.id}`}
                title={`${s.contributorName} · ${s.focus}`}
                trailing={
                  <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums shrink-0">
                    {new Date(s.scheduledAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                }
              />
            ))}
          </MentorListPanel>
        </>
      )}
    </MentorPage>
  );
}

function TodayCard({ s }: { s: SessionDetailEnriched }) {
  const [copied, setCopied] = React.useState(false);
  const link = s.externalLink ?? s.meetingLink ?? "";

  const onCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const inWindow = (() => {
    const start = new Date(s.scheduledAt).getTime();
    const end = start + s.durationMin * 60_000;
    const now = Date.now();
    return now >= start - 15 * 60_000 && now <= end;
  })();

  return (
    <article className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
      <div className="p-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-body text-[13px] font-semibold text-foreground">
            {fmtTime(s.scheduledAt)} · {s.durationMin} min · {s.contributorName}
          </p>
          <p className="mt-0.5 font-body text-[12px] text-text-secondary">Focus: {s.focus}</p>
          {s.contributorCountry && (
            <p className="mt-1 font-body text-[11.5px] text-text-tertiary">{s.contributorCountry}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(inWindow ? mentorPrimaryBtn : mentorSecondaryBtn)}
            >
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Join
            </a>
          ) : null}
        </div>
      </div>
      <footer className="flex flex-wrap items-center gap-2 px-5 py-3 border-t border-stroke-subtle bg-bg-subtle/40">
        <Link href={`/mentor/mentorship/${s.id}`} className={mentorSecondaryBtn}>
          Brief
        </Link>
        {link ? (
          <button type="button" onClick={onCopy} className={mentorSecondaryBtn}>
            {copied ? <Check className="h-3 w-3" strokeWidth={2} aria-hidden /> : <Copy className="h-3 w-3" strokeWidth={2} aria-hidden />}
            {copied ? "Copied" : "Copy link"}
          </button>
        ) : null}
      </footer>
    </article>
  );
}
