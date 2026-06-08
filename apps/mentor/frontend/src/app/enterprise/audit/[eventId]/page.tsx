"use client";

/**
 * Audit event detail — investigation-first record view.
 */

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
} from "lucide-react";
import { useAuditEvents } from "@/lib/hooks/use-audit-view";
import { AuditViewApiError, type AuditViewEvent } from "@/lib/api/audit-view";
import { DashboardSection } from "@/components/meridian/dashboard";
import { AuditDetailSkeleton } from "@/components/enterprise/page-skeletons";
import {
  ActorResourceSection,
  DiffSection,
  fmtFull,
  getAdjacentEvents,
  getRelatedEvents,
  IntegrityPanel,
  investigationSummary,
  PayloadSection,
  RelatedEventsSection,
  severityPillCls,
  TechnicalSection,
} from "./components/detail-sections";
import { cn } from "@/lib/utils/cn";

type EvidenceTab = "payload" | "diff";

export default function AuditEventDetailPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params?.eventId ?? "";

  const now = React.useMemo(() => new Date(), []);
  const ninetyAgo = React.useMemo(
    () => new Date(now.getTime() - 90 * 86_400_000),
    [now],
  );

  const { data, isLoading, error } = useAuditEvents({
    from: ninetyAgo.toISOString(),
    to: now.toISOString(),
    limit: 1000,
  });

  const event: AuditViewEvent | undefined = data?.events.find((e) => e.id === eventId);

  const hasDiff =
    event &&
    ((event.before !== null && event.before !== undefined) ||
      (event.after !== null && event.after !== undefined));

  const [evidenceTab, setEvidenceTab] = React.useState<EvidenceTab>("payload");
  const [copied, setCopied] = React.useState<"json" | "payload" | null>(null);

  React.useEffect(() => {
    if (hasDiff) setEvidenceTab("diff");
    else setEvidenceTab("payload");
  }, [eventId, hasDiff]);

  const copyText = async (text: string, kind: "json" | "payload") => {
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2000);
  };

  if (isLoading) {
    return <AuditDetailSkeleton />;
  }

  if (error || !event) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <BackLink event={null} />
        <div className="rounded-xl border border-error-border bg-error-subtle px-4 py-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
            <div className="flex-1">
              <p className="font-body text-[12.5px] text-error-text">
                {error instanceof AuditViewApiError ? error.message : "Event not found"}
              </p>
              {eventId ? (
                <p className="mt-1 font-mono text-[11px] text-error-text/80">{eventId}</p>
              ) : null}
              <p className="mt-2 font-body text-[12px] text-text-secondary">
                Older than 90 days? Use{" "}
                <Link href="/enterprise/audit/export" className="text-text-link font-medium hover:underline">
                  Export audit
                </Link>{" "}
                to retrieve archived events.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const allEvents = data?.events ?? [];
  const { newer, older } = getAdjacentEvents(allEvents, event.id);
  const related = getRelatedEvents(allEvents, event);
  const relatedHref = `/enterprise/audit?resourceType=${encodeURIComponent(event.resource.type)}&resourceId=${encodeURIComponent(event.resource.id)}`;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <BackLink event={event} />

      {(newer || older) && (
        <nav
          aria-label="Timeline navigation"
          className="flex items-center justify-between gap-3 rounded-lg border border-stroke-subtle bg-surface px-2 py-1.5"
        >
          {older ? (
            <TimelineNavLink direction="older" target={older} />
          ) : (
            <span className="w-[120px]" aria-hidden />
          )}
          <span className="font-body text-[11px] text-text-tertiary hidden sm:block">
            Navigate timeline
          </span>
          {newer ? (
            <TimelineNavLink direction="newer" target={newer} />
          ) : (
            <span className="w-[120px]" aria-hidden />
          )}
        </nav>
      )}

      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Governance · Audit · {event.id.slice(0, 16)}…
        </p>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight font-mono break-all">
              {event.action}
            </h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[12px] text-text-tertiary">
              <span
                className={cn(
                  "inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-semibold capitalize",
                  severityPillCls(event.severity),
                )}
              >
                {event.severity}
              </span>
              <span aria-hidden>·</span>
              <span className="font-mono tabular-nums">{fmtFull(event.timestamp)}</span>
            </div>
            <RecordLinks event={event} relatedHref={relatedHref} />
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void copyText(JSON.stringify(event.payload ?? null, null, 2), "payload")}
              disabled={event.payload === null || event.payload === undefined}
              className={cn(headerBtnCls, "disabled:opacity-40 disabled:cursor-not-allowed")}
            >
              {copied === "payload" ? (
                <Check className="h-3.5 w-3.5 text-success-text" strokeWidth={2} aria-hidden />
              ) : (
                <Copy className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              )}
              Copy payload
            </button>
            <button
              type="button"
              onClick={() => void copyText(JSON.stringify(event, null, 2), "json")}
              className={headerBtnCls}
            >
              {copied === "json" ? (
                <Check className="h-3.5 w-3.5 text-success-text" strokeWidth={2} aria-hidden />
              ) : (
                <Copy className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              )}
              Copy event
            </button>
          </div>
        </div>
      </header>

      {!event.signatureValid && (
        <ContextBanner tone="error" title="Do not trust this record">
          Tamper-evidence verification failed. Treat as compromised until your security team
          completes investigation.
        </ContextBanner>
      )}

      {event.severity === "critical" && event.signatureValid && (
        <ContextBanner tone="warning" title="Critical severity">
          This action has compliance impact — review evidence below and check related events on
          the same resource.
        </ContextBanner>
      )}

      <DashboardSection title="Summary" description="What happened">
        <div className="space-y-4">
          <p className="font-body text-[14px] text-foreground leading-relaxed">
            {investigationSummary(event)}
          </p>
          <IntegrityPanel event={event} />
        </div>
      </DashboardSection>

      <DashboardSection title="Actor & resource" description="Who, what, and where">
        <ActorResourceSection event={event} />
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-4 pb-0 border-b border-stroke-subtle">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-3">
            <div>
              <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                Evidence
              </h2>
              <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                Payload and state captured at event time
              </p>
            </div>
            <Link
              href="/enterprise/audit/export"
              className={cn(
                "inline-flex items-center gap-1.5 h-8 px-3 rounded-md shrink-0",
                "bg-surface border border-stroke font-body text-[12px] font-semibold text-foreground",
                "hover:bg-surface-hover transition-colors duration-fast",
              )}
            >
              <Download className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Export
            </Link>
          </div>

          {hasDiff && (
            <nav aria-label="Evidence tabs" className="flex gap-x-1 -mb-px">
              {(
                [
                  { key: "diff" as const, label: "State change" },
                  { key: "payload" as const, label: "Payload" },
                ] as const
              ).map((tab) => {
                const active = evidenceTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setEvidenceTab(tab.key)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative px-3 py-2.5 font-body text-[13px] font-medium",
                      active ? "text-foreground" : "text-text-secondary",
                    )}
                  >
                    {tab.label}
                    {active && (
                      <span
                        aria-hidden
                        className="absolute inset-x-2 bottom-0 h-0.5 bg-brand rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        <div className="px-5 py-4">
          {evidenceTab === "diff" && hasDiff ? (
            <DiffSection event={event} />
          ) : (
            <PayloadSection event={event} />
          )}
        </div>
      </section>

      <DashboardSection
        title="Related on this resource"
        description={`${related.length} other event${related.length === 1 ? "" : "s"} in the last 90 days`}
        viewAllHref={related.length > 0 ? relatedHref : undefined}
        viewAllLabel="View in audit log"
      >
        <RelatedEventsSection events={related} currentId={event.id} />
      </DashboardSection>

      <DashboardSection title="Technical identifiers" description="For export and correlation">
        <TechnicalSection event={event} />
      </DashboardSection>
    </div>
  );
}

function BackLink({ event }: { event: AuditViewEvent | null }) {
  const href = event
    ? `/enterprise/audit?resourceType=${encodeURIComponent(event.resource.type)}&resourceId=${encodeURIComponent(event.resource.id)}`
    : "/enterprise/audit";

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 font-body text-[12px] font-medium text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm"
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      {event ? "Back to resource timeline" : "Back to audit log"}
    </Link>
  );
}

function TimelineNavLink({
  direction,
  target,
}: {
  direction: "newer" | "older";
  target: AuditViewEvent;
}) {
  const isNewer = direction === "newer";
  return (
    <Link
      href={`/enterprise/audit/${target.id}`}
      className={cn(
        "inline-flex items-center gap-1 max-w-[48%] px-2 py-1.5 rounded-md",
        "font-body text-[12px] font-medium text-text-link",
        "hover:bg-bg-subtle transition-colors duration-fast",
        isNewer ? "ml-auto text-right" : "",
      )}
    >
      {!isNewer && <ChevronLeft className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />}
      <span className="min-w-0 truncate">
        <span className="block font-body text-[10px] text-text-tertiary">
          {isNewer ? "More recent" : "Earlier"}
        </span>
        <span className="font-mono text-[11.5px]">{target.action}</span>
      </span>
      {isNewer && <ChevronRight className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />}
    </Link>
  );
}

function RecordLinks({
  event,
  relatedHref,
}: {
  event: AuditViewEvent;
  relatedHref: string;
}) {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link
        href={relatedHref}
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        All on this resource
      </Link>
      <span aria-hidden className="text-text-disabled">
        ·
      </span>
      <Link
        href={`/enterprise/audit?actor=${encodeURIComponent(event.actor.userId)}`}
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        By this actor
      </Link>
      <span aria-hidden className="text-text-disabled">
        ·
      </span>
      <Link
        href="/enterprise/compliance"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Compliance
      </Link>
    </p>
  );
}

function ContextBanner({
  tone,
  title,
  children,
}: {
  tone: "error" | "warning";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        tone === "error"
          ? "border-error-border bg-error-subtle/80"
          : "border-warning-border bg-warning-subtle/50",
      )}
    >
      <p
        className={cn(
          "font-body text-[13px] font-semibold flex items-center gap-1.5",
          tone === "error" ? "text-error-text" : "text-foreground",
        )}
      >
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
        {title}
      </p>
      <p className="mt-1 font-body text-[12.5px] text-text-secondary leading-relaxed">{children}</p>
    </div>
  );
}

const headerBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3 rounded-md",
  "bg-surface border border-stroke font-body text-[12.5px] font-semibold text-foreground",
  "hover:bg-surface-hover transition-colors duration-fast",
);
