"use client";

import { notFound } from "next/navigation";
import { AlertCircle, Scale } from "lucide-react";
import { DashboardSection } from "@/components/meridian/dashboard";
import { StatusChip } from "@/components/meridian";
import { ContributorApiError } from "@/lib/api/contributor-mock";
import { useGrievance } from "@/lib/hooks/use-contributor-support";
import {
  fmtDateOnly,
  fmtDateTime,
  fmtRelative,
  fmtUpdatedDate,
  grievanceStatusChip,
  grievanceStatusLabel,
  grievanceTypeLabel,
} from "../../../lib/support-ui-utils";
import { SupportDetailSkeleton } from "../../../components/support-detail-skeleton";
import {
  AttachmentList,
  CaseTimeline,
  DetailField,
  RailItem,
} from "../../../components/support-detail-parts";

interface GrievanceDetailViewProps {
  grievanceId: string;
}

export function GrievanceDetailView({ grievanceId }: GrievanceDetailViewProps) {
  const { data, isPending, isError, error } = useGrievance(grievanceId || undefined);

  if (!grievanceId || isPending) {
    return <SupportDetailSkeleton />;
  }

  if (isError) {
    if (error instanceof ContributorApiError && error.status === 404) notFound();
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">
            {(error as Error).message}
          </p>
        </div>
      </div>
    );
  }

  const grievance = data?.grievance;
  if (!grievance) notFound();

  return (
    <div className="pb-12 animate-fade-in">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="space-y-5 min-w-0">
          <header className="border-b border-stroke-subtle pb-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
                  {grievanceTypeLabel(grievance.type)}
                </h1>
                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 font-body text-[12.5px] text-text-secondary">
                  <StatusChip status={grievanceStatusChip(grievance.status)} size="sm">
                    {grievanceStatusLabel(grievance.status)}
                  </StatusChip>
                  <span aria-hidden className="opacity-40">·</span>
                  <span className="font-mono text-[11.5px] tabular-nums">{grievance.caseRef}</span>
                  <span aria-hidden className="opacity-40">·</span>
                  <span>Updated {fmtRelative(grievance.updatedAt)}</span>
                </p>
                <p className="mt-2 font-body text-[12.5px] text-text-secondary leading-relaxed max-w-2xl">
                  {grievance.summary}
                </p>
              </div>
            </div>
          </header>

          <div className="rounded-lg border border-warning-border/50 bg-warning-subtle/30 px-4 py-3.5 flex items-start gap-3">
            <Scale className="h-4 w-4 text-warning-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
            <p className="font-body text-[12px] text-foreground leading-relaxed">
              Grievances are reviewed by an independent panel outside your mentor chain. Outcomes may
              include re-review, payout correction, or policy updates.
            </p>
          </div>

          <DashboardSection title="Your grievance" description="What you submitted">
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Incident date" value={fmtDateOnly(grievance.incidentDate)} />
              <DetailField
                label="Related reference"
                value={grievance.relatedReference ?? "Not specified"}
                mono={Boolean(grievance.relatedReference)}
              />
            </dl>
            <div className="mt-4 pt-4 border-t border-stroke-subtle space-y-4">
              <DetailField label="What happened" value={grievance.story} />
              <DetailField label="Outcome sought" value={grievance.desiredOutcome} />
            </div>
            {grievance.attachments.length > 0 ? (
              <div className="mt-4 pt-4 border-t border-stroke-subtle">
                <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-2">
                  Evidence
                </p>
                <AttachmentList files={grievance.attachments} />
              </div>
            ) : null}
          </DashboardSection>

          <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
            <div className="px-5 py-3.5 border-b border-stroke-subtle bg-bg-subtle/40">
              <h2 className="font-body text-[13px] font-semibold text-foreground">Case timeline</h2>
              <p className="mt-0.5 font-body text-[11.5px] text-text-secondary">
                Updates from the grievance panel
              </p>
            </div>
            <CaseTimeline updates={grievance.updates} />
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-[calc(var(--shell-topbar-height,52px)+1rem)] xl:self-start xl:max-h-[calc(100dvh-var(--shell-topbar-height,52px)-2rem)] xl:overflow-y-auto xl:overscroll-y-contain">
          <DashboardSection title="Case details" description="Reference and status">
            <dl className="space-y-3">
              <RailItem label="Case ref">
                <span className="font-mono text-[11.5px] tabular-nums">{grievance.caseRef}</span>
              </RailItem>
              <RailItem label="Type">{grievanceTypeLabel(grievance.type)}</RailItem>
              <RailItem label="Submitted">{fmtUpdatedDate(grievance.submittedAt)}</RailItem>
              <RailItem label="Last update">{fmtDateTime(grievance.updatedAt)}</RailItem>
            </dl>
          </DashboardSection>

          <DashboardSection title="What happens next" description="Grievance SLA">
            <p className="font-body text-[12.5px] text-text-secondary leading-relaxed">
              First response within 5 business days. You will be notified here and by email when the
              panel requests more information or reaches a decision.
            </p>
          </DashboardSection>
        </aside>
      </div>
    </div>
  );
}
