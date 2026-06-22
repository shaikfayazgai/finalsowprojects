"use client";

import * as React from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { ExternalLink, Copy, Check, AlertCircle, Save } from "lucide-react";
import { DashboardSection } from "@/components/meridian/dashboard";
import {
  MentorPage,
  MentorPageHeader,
  MentorBackLink,
  MentorBanner,
  MentorFormSection,
  mentorTextareaCls,
  mentorPrimaryBtn,
  mentorSecondaryBtn,
} from "@/app/mentor/_components/mentor-ui";
import { MentorDetailSkeleton } from "@/app/mentor/_components/mentor-skeletons";
import {
  useMentorSession,
  useSessionAction,
  useWriteNote,
} from "@/lib/hooks/use-mentor-mentorship";
import { MentorshipApiError } from "@/lib/api/mentor-mentorship";

function fmtRange(iso: string, mins: number) {
  const start = new Date(iso);
  const end = new Date(start.getTime() + mins * 60_000);
  const t = new Date();
  const label =
    start.toDateString() === t.toDateString()
      ? "Today"
      : start.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  return `${label} ${start.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false })}–${end.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false })}`;
}

export default function SessionDetailPage() {
  const router = useRouter();
  const params = useParams<{ sessionId: string }>();
  const id = params?.sessionId ?? "";

  const { data, isLoading, error } = useMentorSession(id);
  const sessionAction = useSessionAction(id);
  const s = data?.session;

  const [note, setNote] = React.useState("");
  const [visibleToContrib, setVisibleToContrib] = React.useState(true);
  const [copied, setCopied] = React.useState(false);
  const [savedDraft, setSavedDraft] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const writeNote = useWriteNote(s?.contributorId ?? "");

  if (error instanceof MentorshipApiError && error.status === 404) notFound();

  const link = s?.externalLink ?? s?.meetingLink ?? "";

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

  const onSaveDraft = async () => {
    if (!s || !note.trim()) return;
    const visibility = visibleToContrib ? "shared" : "private";
    await writeNote.mutateAsync({
      sessionId: s.id,
      contributorId: s.contributorId,
      body: note.trim(),
      visibility,
    });
    setSavedDraft(true);
    setTimeout(() => setSavedDraft(false), 1800);
  };

  const onFinish = async () => {
    if (!s || !note.trim()) return;
    setSubmitting(true);
    try {
      const visibility = visibleToContrib ? "shared" : "private";
      await writeNote.mutateAsync({
        sessionId: s.id,
        contributorId: s.contributorId,
        body: note.trim(),
        visibility,
      });
      await sessionAction.mutateAsync({ action: "held" });
      router.push("/mentor/mentorship");
    } finally {
      setSubmitting(false);
    }
  };

  if (error && !(error instanceof MentorshipApiError)) {
    return (
      <MentorPage>
        <MentorBackLink href="/mentor/mentorship">Back to sessions</MentorBackLink>
        <MentorBanner tone="error" icon={<AlertCircle className="h-4 w-4" strokeWidth={2} aria-hidden />}>
          Could not load session.
        </MentorBanner>
      </MentorPage>
    );
  }

  if (isLoading || !s) return <MentorDetailSkeleton />;

  const canFinish = note.trim().length > 0 && !submitting && s.status === "scheduled";

  return (
    <MentorPage>
      <MentorBackLink href="/mentor/mentorship">Back to sessions</MentorBackLink>

      <MentorPageHeader
        eyebrow="Mentorship session"
        title={s.contributorName}
        subtitle={
          <>
            {fmtRange(s.scheduledAt, s.durationMin)}
            <span aria-hidden className="opacity-50 mx-1.5">
              ·
            </span>
            Focus: {s.focus}
          </>
        }
      />

      <DashboardSection title="Contributor brief">
        <p className="font-body text-[13px] text-foreground">
          {s.contributorName}
          {s.contributorTitle ? ` · ${s.contributorTitle}` : ""}
          {s.contributorCountry ? ` · ${s.contributorCountry}` : ""}
        </p>
      </DashboardSection>

      {link ? (
        <DashboardSection title="External meeting">
          <p className="font-mono text-[11.5px] text-foreground break-all">{link}</p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <a href={link} target="_blank" rel="noopener noreferrer" className={mentorPrimaryBtn}>
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Open meeting
            </a>
            <button type="button" onClick={onCopy} className={mentorSecondaryBtn}>
              {copied ? <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> : <Copy className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </DashboardSection>
      ) : null}

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle">
          <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
            Coaching note
          </h2>
        </header>

        <MentorFormSection title="Session notes">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={6}
            placeholder="What you discussed, action items, and any follow-up."
            className={mentorTextareaCls}
          />
        </MentorFormSection>

        <div className="px-5 pb-5">
          <label className="inline-flex items-center gap-2 font-body text-[12.5px] text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={visibleToContrib}
              onChange={(e) => setVisibleToContrib(e.target.checked)}
              className="h-3.5 w-3.5 accent-brand rounded-sm"
            />
            Visible to <span className="font-semibold">{s.contributorName}</span> in their profile
          </label>
        </div>

        <footer className="flex items-center justify-between gap-2 px-5 py-4 border-t border-stroke-subtle bg-bg-subtle/40">
          <button
            type="button"
            disabled={sessionAction.isPending || s.status !== "scheduled"}
            onClick={() => sessionAction.mutate({ action: "no_show" })}
            className="inline-flex items-center h-9 px-3.5 rounded-md font-body text-[12.5px] font-semibold text-error-text hover:bg-error-subtle transition-colors duration-fast disabled:opacity-50"
          >
            Mark no-show
          </button>
          <div className="flex items-center gap-2">
            {savedDraft && (
              <span className="font-body text-[11px] text-text-tertiary">Draft saved</span>
            )}
            <button type="button" onClick={onSaveDraft} disabled={!note.trim() || writeNote.isPending} className={mentorSecondaryBtn}>
              <Save className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Save draft
            </button>
            <button type="button" onClick={onFinish} disabled={!canFinish} className={mentorPrimaryBtn}>
              {submitting ? "Saving…" : "Save and finish"}
            </button>
          </div>
        </footer>
      </section>
    </MentorPage>
  );
}
