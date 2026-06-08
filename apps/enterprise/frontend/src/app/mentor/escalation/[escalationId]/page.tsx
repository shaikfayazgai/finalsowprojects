"use client";

/**
 * Escalation detail — spec doc 03 §5.F.2.
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, notFound } from "next/navigation";
import { AlertTriangle, ExternalLink, AlertCircle } from "lucide-react";
import type { MockEscalation } from "@/mocks/mentor";
import { fetchMentorEscalation, MentorApiError } from "@/lib/api/mentor-mock";
import { StatusChip } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import {
  MentorPage,
  MentorPageHeader,
  MentorBackLink,
  MentorBanner,
  MentorFormSection,
  mentorFieldLabel,
  mentorTextareaCls,
  mentorPrimaryBtn,
  mentorSecondaryBtn,
  mentorGhostLink,
} from "@/app/mentor/_components/mentor-ui";
import { MentorDetailSkeleton } from "@/app/mentor/_components/mentor-skeletons";

type Adjudication = "uphold" | "override_accept" | "override_rework" | "reassign";

function fmtRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function severityStatus(severity: MockEscalation["severity"]): "error" | "warning" | "neutral" {
  if (severity === "critical") return "error";
  if (severity === "high") return "warning";
  return "neutral";
}

export default function EscalationDetailPage() {
  const router = useRouter();
  const params = useParams<{ escalationId: string }>();
  const id = params?.escalationId ?? "";

  const [esc, setEsc] = React.useState<MockEscalation | null>(null);
  const [loadErr, setLoadErr] = React.useState<string | null>(null);
  const [nf, setNf] = React.useState(false);
  const [adj, setAdj] = React.useState<Adjudication>("uphold");
  const [reason, setReason] = React.useState("");
  const [coach, setCoach] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    const c = new AbortController();
    fetchMentorEscalation(id, c.signal)
      .then((res) => setEsc(res.escalation))
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError") return;
        if (err instanceof MentorApiError && err.status === 404) setNf(true);
        else setLoadErr(err instanceof Error ? err.message : "Could not load escalation.");
      });
    return () => c.abort();
  }, [id]);

  if (nf) notFound();

  const valid = reason.trim().length > 0;

  if (loadErr) {
    return (
      <MentorPage>
        <MentorBackLink href="/mentor/escalation">Back to escalations</MentorBackLink>
        <MentorBanner tone="error" icon={<AlertCircle className="h-4 w-4" strokeWidth={2} aria-hidden />}>
          {loadErr}
        </MentorBanner>
      </MentorPage>
    );
  }

  if (!esc) return <MentorDetailSkeleton />;

  const onSubmit = async () => {
    if (!valid) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    router.push("/mentor/escalation");
  };

  return (
    <MentorPage>
      <MentorBackLink href="/mentor/escalation">Back to escalations</MentorBackLink>

      <MentorPageHeader
        eyebrow={`Escalation · ${esc.type.replace("_", " ")}`}
        title={esc.taskTitle}
        subtitle={
          <>
            {esc.contributorName}
            <span aria-hidden className="opacity-50 mx-1.5">
              ·
            </span>
            {esc.project}
          </>
        }
        meta={
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <StatusChip status={severityStatus(esc.severity)} size="sm">
              {esc.severity} severity
            </StatusChip>
            <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums">
              Opened {fmtRelative(esc.openedAt)}
            </span>
          </div>
        }
      />

      <DashboardSection title="Context">
        <div className="space-y-3">
          <p className="font-body text-[12.5px] text-foreground">
            Original mentor: <span className="font-semibold">{esc.originalMentorName}</span>
            <span aria-hidden className="opacity-50 mx-1.5">
              ·
            </span>
            Original decision:{" "}
            <span className="font-semibold capitalize">{esc.originalDecision}</span> (
            {fmtDate(esc.originalDecisionAt)})
          </p>
          {esc.rejectReason && (
            <div>
              <p className={mentorFieldLabel}>Reject reason</p>
              <p className="rounded-md bg-bg-subtle border border-stroke-subtle px-3 py-2 font-body text-[12.5px] text-foreground whitespace-pre-wrap">
                &ldquo;{esc.rejectReason}&rdquo;
              </p>
            </div>
          )}
          {esc.contributorDispute && (
            <div>
              <p className={mentorFieldLabel}>
                Contributor&apos;s dispute ({esc.contributorName})
              </p>
              <p className="rounded-md bg-bg-subtle border border-stroke-subtle px-3 py-2 font-body text-[12.5px] text-foreground whitespace-pre-wrap">
                &ldquo;{esc.contributorDispute}&rdquo;
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <a href="#" className={mentorGhostLink}>
              Open original review
              <ExternalLink className="inline h-3 w-3 ml-0.5" strokeWidth={2} aria-hidden />
            </a>
            <a href="#" className={mentorGhostLink}>
              Open contributor notes
              <ExternalLink className="inline h-3 w-3 ml-0.5" strokeWidth={2} aria-hidden />
            </a>
          </div>
        </div>
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle">
          <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
            Your adjudication
          </h2>
        </header>

        <MentorFormSection title="Decision">
          <div className="space-y-1.5">
            <Radio name="adj" checked={adj === "uphold"} onChange={() => setAdj("uphold")}>
              Uphold original mentor&apos;s decision (reject stands)
            </Radio>
            <Radio name="adj" checked={adj === "override_accept"} onChange={() => setAdj("override_accept")}>
              Override — change to Accept
            </Radio>
            <Radio name="adj" checked={adj === "override_rework"} onChange={() => setAdj("override_rework")}>
              Override — change to Rework
            </Radio>
            <Radio name="adj" checked={adj === "reassign"} onChange={() => setAdj("reassign")}>
              Reassign to a different mentor for fresh review
            </Radio>
          </div>
        </MentorFormSection>

        <MentorFormSection title="Reasoning" description="Visible to all parties" bordered>
          <label className={mentorFieldLabel} htmlFor="adj-reason">
            Reasoning *
          </label>
          <textarea
            id="adj-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={5}
            placeholder="Explain how you weighed both sides and what evidence drove the call."
            className={mentorTextareaCls}
          />
        </MentorFormSection>

        <div className="px-5 pb-5">
          <label className="inline-flex items-center gap-2 font-body text-[12.5px] text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={coach}
              onChange={(e) => setCoach(e.target.checked)}
              className="h-3.5 w-3.5 accent-brand rounded-sm"
            />
            Add a coaching note to <span className="font-semibold">{esc.originalMentorName}</span>
            &apos;s record
          </label>

          {adj === "override_accept" && (
            <div className="mt-4">
              <MentorBanner
                tone="warning"
                icon={<AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}
              >
                Both the original mentor and the contributor will be notified that the decision was
                changed to Accept.
              </MentorBanner>
            </div>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 px-5 py-4 border-t border-stroke-subtle bg-bg-subtle/40">
          <Link href="/mentor/escalation" className={mentorSecondaryBtn}>
            Cancel
          </Link>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!valid || submitting}
            className={mentorPrimaryBtn}
          >
            {submitting ? "Submitting…" : "Submit adjudication"}
          </button>
        </footer>
      </section>
    </MentorPage>
  );
}

function Radio({
  name,
  checked,
  onChange,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2 font-body text-[12.5px] text-foreground cursor-pointer">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="h-3.5 w-3.5 accent-brand" />
      {children}
    </label>
  );
}
