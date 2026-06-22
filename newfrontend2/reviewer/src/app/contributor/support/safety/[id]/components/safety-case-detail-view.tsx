"use client";

import { notFound } from "next/navigation";
import { AlertCircle, Lock, ShieldAlert } from "lucide-react";
import { DashboardSection } from "@/components/meridian/dashboard";
import { StatusChip } from "@/components/meridian";
import { ContributorApiError } from "@/lib/api/contributor-mock";
import { useSafetyCase } from "@/lib/hooks/use-contributor-support";
import {
  fmtDateOnly,
  fmtDateTime,
  fmtRelative,
  fmtUpdatedDate,
  safetyStatusChip,
  safetyStatusLabel,
  safetyTypeLabel,
} from "../../../lib/support-ui-utils";
import { SupportDetailSkeleton } from "../../../components/support-detail-skeleton";
import {
  AttachmentList,
  CaseTimeline,
  DetailField,
  RailItem,
} from "../../../components/support-detail-parts";

interface SafetyCaseDetailViewProps {
  caseId: string;
}

export function SafetyCaseDetailView({ caseId }: SafetyCaseDetailViewProps) {
  const { data, isPending, isError, error } = useSafetyCase(caseId || undefined);

  if (!caseId || isPending) {
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

  const safetyCase = data?.safetyCase;
  if (!safetyCase) notFound();

  return (
    <div className="pb-12 animate-fade-in">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="space-y-5 min-w-0">
          <header className="border-b border-stroke-subtle pb-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
                  {safetyTypeLabel(safetyCase.type)}
                </h1>
                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 font-body text-[12.5px] text-text-secondary">
                  <StatusChip status={safetyStatusChip(safetyCase.status)} size="sm">
                    {safetyStatusLabel(safetyCase.status)}
                  </StatusChip>
                  <span aria-hidden className="opacity-40">·</span>
                  <span className="font-mono text-[11.5px] tabular-nums">{safetyCase.caseRef}</span>
                  <span aria-hidden className="opacity-40">·</span>
                  <span>Updated {fmtRelative(safetyCase.updatedAt)}</span>
                  {safetyCase.anonymous ? (
                    <>
                      <span aria-hidden className="opacity-40">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Lock className="h-3 w-3" strokeWidth={2} aria-hidden />
                        Anonymous
                      </span>
                    </>
                  ) : null}
                </p>
                <p className="mt-2 font-body text-[12.5px] text-text-secondary leading-relaxed max-w-2xl">
                  {safetyCase.summary}
                </p>
              </div>
            </div>
          </header>

          <div className="rounded-lg border border-error-border/40 bg-error-subtle/30 px-4 py-3.5 flex items-start gap-3">
            <ShieldAlert className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
            <p className="font-body text-[12px] text-foreground leading-relaxed">
              This channel is confidential. Only trained Trust & Safety investigators can access your
              report. Retaliation for good-faith reporting violates platform policy.
            </p>
          </div>

          <DashboardSection title="Your report" description="What you submitted">
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Incident date" value={fmtDateOnly(safetyCase.incidentDate)} />
              <DetailField
                label="People involved"
                value={safetyCase.involved ?? "Not specified"}
              />
            </dl>
            <div className="mt-4 pt-4 border-t border-stroke-subtle">
              <DetailField label="What happened" value={safetyCase.story} />
            </div>
            {safetyCase.attachments.length > 0 ? (
              <div className="mt-4 pt-4 border-t border-stroke-subtle">
                <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-2">
                  Evidence
                </p>
                <AttachmentList files={safetyCase.attachments} />
              </div>
            ) : null}
          </DashboardSection>

          <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
            <div className="px-5 py-3.5 border-b border-stroke-subtle bg-bg-subtle/40">
              <h2 className="font-body text-[13px] font-semibold text-foreground">Case timeline</h2>
              <p className="mt-0.5 font-body text-[11.5px] text-text-secondary">
                Updates from the investigation team
              </p>
            </div>
            <CaseTimeline updates={safetyCase.updates} />
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-[calc(var(--shell-topbar-height,52px)+1rem)] xl:self-start xl:max-h-[calc(100dvh-var(--shell-topbar-height,52px)-2rem)] xl:overflow-y-auto xl:overscroll-y-contain">
          <DashboardSection title="Case details" description="Reference and status">
            <dl className="space-y-3">
              <RailItem label="Case ref">
                <span className="font-mono text-[11.5px] tabular-nums">{safetyCase.caseRef}</span>
              </RailItem>
              <RailItem label="Type">{safetyTypeLabel(safetyCase.type)}</RailItem>
              <RailItem label="Submitted">{fmtUpdatedDate(safetyCase.submittedAt)}</RailItem>
              <RailItem label="Last update">{fmtDateTime(safetyCase.updatedAt)}</RailItem>
              <RailItem label="Identity">
                {safetyCase.anonymous ? "Anonymous submission" : "Linked to your account"}
              </RailItem>
            </dl>
          </DashboardSection>

          <DashboardSection title="What happens next" description="Trust & Safety SLA">
            <p className="font-body text-[12.5px] text-text-secondary leading-relaxed">
              Initial response within 24 hours. Complex cases may take longer while we gather
              evidence and apply interim safeguards.
            </p>
          </DashboardSection>
        </aside>
      </div>
    </div>
  );
}
